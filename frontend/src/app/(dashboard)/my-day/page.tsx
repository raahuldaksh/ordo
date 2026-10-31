"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { DayTimeline } from '@/components/planner/DayTimeline';
import { UnscheduledQueue } from '@/components/planner/UnscheduledQueue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function MyDayPage() {
  const { selectedDate, setQuickAddOpen } = useUIStore();

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

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Day Planner</h1>
          <p className="text-xs text-muted-foreground font-mono">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')} • {metrics.totalScheduled} scheduled tasks • {metrics.completionRate}% completed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Fixed: {schedule?.scheduled?.fixed?.length || 0}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            Flexible: {schedule?.scheduled?.flexible?.length || 0}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            Unplanned: {schedule?.scheduled?.unplanned?.length || 0}
          </Badge>

          <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1.5 font-medium ml-2">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Main planner body: 24h Timeline + Unscheduled Queue */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <DayTimeline schedule={schedule} isLoading={isLoading} />
        <UnscheduledQueue tasks={schedule?.unscheduled || []} />
      </div>
    </div>
  );
}

