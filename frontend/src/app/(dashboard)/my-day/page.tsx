"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { DayTimeline } from '@/components/planner/DayTimeline';
import { UnscheduledQueue } from '@/components/planner/UnscheduledQueue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, ListTodo } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MyDayPage() {
  const { selectedDate, setQuickAddOpen } = useUIStore();
  const [activeMobileTab, setActiveMobileTab] = useState<'timeline' | 'queue'>('timeline');

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['planner-day', selectedDate],
    queryFn: () => api.getDaySchedule(selectedDate)
  });

  const metrics = schedule?.metrics || {
    totalScheduled: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    halfCount: 0,
    completionRate: 0,
    plannedMinutes: 0
  };

  const unscheduledCount = schedule?.unscheduled?.length || 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] space-y-3 sm:space-y-4 min-w-0">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">My Day Planner</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')} • {metrics.totalScheduled} scheduled tasks • {metrics.completionRate}% completed
          </p>
        </div>

        {/* Badges + Add Task Action (horizontally scrollable on mobile) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="font-mono text-[11px] sm:text-xs">
              Fixed: {schedule?.scheduled?.fixed?.length || 0}
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px] sm:text-xs">
              Flexible: {schedule?.scheduled?.flexible?.length || 0}
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px] sm:text-xs">
              Unplanned: {schedule?.scheduled?.unplanned?.length || 0}
            </Badge>
          </div>

          <Button
            size="sm"
            onClick={() => setQuickAddOpen(true)}
            className="gap-1.5 font-medium shrink-0 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Mobile/Tablet Segmented View Switcher (< 1024px) */}
      <div className="lg:hidden flex rounded-lg border border-border p-1 bg-card/80 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab('timeline')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all",
            activeMobileTab === 'timeline'
              ? "bg-foreground text-background shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>24-Hour Timeline ({metrics.totalScheduled})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab('queue')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all",
            activeMobileTab === 'queue'
              ? "bg-foreground text-background shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListTodo className="h-3.5 w-3.5" />
          <span>Unscheduled Queue ({unscheduledCount})</span>
        </button>
      </div>

      {/* Main planner body: 24h Timeline + Unscheduled Queue */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden min-w-0">
        {/* Timeline: Full on mobile when active, always visible on lg */}
        <div className={cn("flex-1 h-full min-h-0 min-w-0", activeMobileTab !== 'timeline' && "hidden lg:flex")}>
          <DayTimeline schedule={schedule} isLoading={isLoading} />
        </div>

        {/* Queue: Full on mobile when active, fixed width on lg */}
        <div className={cn("w-full lg:w-80 h-full min-h-0 shrink-0", activeMobileTab !== 'queue' && "hidden lg:flex")}>
          <UnscheduledQueue tasks={schedule?.unscheduled || []} />
        </div>
      </div>
    </div>
  );
}
