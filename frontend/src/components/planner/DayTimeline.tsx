"use client";

import React, { useRef, useEffect } from 'react';
import { Task, DaySchedule } from '@/types/api';
import { useUIStore } from '@/stores/uiStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTimeRange, cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, PieChart, AlertCircle, ArrowDown } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64; // px per hour

interface DayTimelineProps {
  schedule?: DaySchedule;
  isLoading?: boolean;
}

export function DayTimeline({ schedule, isLoading }: DayTimelineProps) {
  const { selectedDate, setQuickAddOpen, setQuickAddInitialTime, setStatusModalTask } = useUIStore();
  const timelineRef = useRef<HTMLDivElement>(null);

  const isToday = isSameDay(parseISO(selectedDate), new Date());
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeTop = (currentMinutes / 60) * HOUR_HEIGHT;

  // Auto-scroll to current hour on load
  useEffect(() => {
    if (isToday && timelineRef.current) {
      const scrollPos = Math.max(0, currentTimeTop - 200);
      timelineRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  }, [isToday, selectedDate, currentTimeTop]);

  const scrollToNow = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo({ top: Math.max(0, currentTimeTop - 200), behavior: 'smooth' });
    }
  };

  const handleSlotClick = (hour: number) => {
    const formattedHour = String(hour).padStart(2, '0');
    setQuickAddInitialTime(`${formattedHour}:00`);
    setQuickAddOpen(true);
  };

  const tasks = schedule?.allScheduled || [];

  return (
    <div className="relative flex flex-col flex-1 h-full min-h-0 bg-background border border-border rounded-xl shadow-xs overflow-hidden">
      {/* Timeline Controls Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border bg-card/60 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            24-Hour Timeline
          </span>
          <span className="text-xs text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {isToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToNow}
            className="h-7 text-xs gap-1 font-mono px-2 sm:px-3"
          >
            <ArrowDown className="h-3 w-3" />
            <span className="hidden xs:inline">Jump to</span> Now
          </Button>
        )}
      </div>

      {/* 24-Hour Scroll Area */}
      <div ref={timelineRef} className="relative flex-1 overflow-y-auto">
        <div className="relative min-w-[320px] w-full" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Current Time Indicator Line */}
          {isToday && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className="w-12 sm:w-16 text-right pr-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-600 text-white shadow-xs">
                  {format(now, 'HH:mm')}
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-blue-500/80 relative">
                <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-500/20 shadow-xs" />
              </div>
            </div>
          )}

          {/* Hour Grid Slots */}
          {HOURS.map((hour) => {
            const timeLabel = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div
                key={hour}
                onClick={() => handleSlotClick(hour)}
                className="absolute left-0 right-0 border-b border-border/40 group hover:bg-muted/30 cursor-pointer transition-colors"
                style={{
                  top: `${hour * HOUR_HEIGHT}px`,
                  height: `${HOUR_HEIGHT}px`
                }}
              >
                <div className="w-12 sm:w-16 h-full flex items-start justify-end pr-2 sm:pr-3 pt-1 text-[11px] font-mono text-muted-foreground select-none group-hover:text-foreground">
                  {timeLabel}
                </div>
                {/* 30-min dashed sub-line */}
                <div
                  className="absolute left-12 sm:left-16 right-0 border-b border-dashed border-border/20 pointer-events-none"
                  style={{ top: `${HOUR_HEIGHT / 2}px` }}
                />
              </div>
            );
          })}

          {/* Task Render Blocks */}
          {tasks.map((task) => {
            if (!task.scheduledStartAt) return null;
            const start = new Date(task.scheduledStartAt);
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const top = (startMinutes / 60) * HOUR_HEIGHT;
            const height = Math.max(36, ((task.durationMinutes || 30) / 60) * HOUR_HEIGHT - 2);

            return (
              <div
                key={task._id}
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusModalTask(task);
                }}
                className={cn(
                  "absolute left-14 sm:left-20 right-2 sm:right-4 rounded-lg p-2 sm:p-2.5 z-10 cursor-pointer shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md border",
                  task.taskType === 'FIXED' && "bg-card border-foreground/30 font-medium",
                  task.taskType === 'FLEXIBLE' && "bg-card/90 border-border",
                  task.taskType === 'UNPLANNED' && "bg-muted/40 border-dashed border-border",
                  task.status === 'SUCCESS' && "border-emerald-500/40 bg-emerald-500/5",
                  task.status === 'FAILED' && "border-rose-500/50 bg-rose-500/5",
                  task.status === 'HALF' && "border-amber-500/40 bg-amber-500/5"
                )}
                style={{
                  top: `${top}px`,
                  height: `${height}px`
                }}
                title={`Click to record outcome: ${task.title}`}
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {task.status === 'SUCCESS' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    {task.status === 'HALF' && <PieChart className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                    {task.status === 'FAILED' && <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                    {task.status === 'PENDING' && <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}

                    <span className="text-xs font-semibold truncate tracking-tight">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase tracking-wider font-mono">
                      {task.taskType}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground hidden xs:inline">
                      {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt)}
                    </span>
                  </div>
                </div>

                {/* Subtitle / Reason preview if height allows */}
                {height >= 56 && (task.reasonCategory || task.actualReason) && (
                  <div className="flex items-center gap-1 text-[11px] text-destructive pt-1 truncate font-mono">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{task.reasonCategory}: {task.actualReason || 'Missed'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
