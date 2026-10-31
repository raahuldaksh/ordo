"use client";

import React, { useState } from 'react';
import { Task } from '@/types/api';
import { useUIStore } from '@/stores/uiStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface UnscheduledQueueProps {
  tasks: Task[];
}

export function UnscheduledQueue({ tasks }: UnscheduledQueueProps) {
  const { selectedDate, setStatusModalTask } = useUIStore();
  const queryClient = useQueryClient();
  const [scheduleTime, setScheduleTime] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState('');

  const quickAddUnscheduled = useMutation({
    mutationFn: (title: string) => api.createTask({
      title,
      taskType: 'UNPLANNED',
      priority: 'MEDIUM',
      scheduledStartAt: null,
      scheduledEndAt: null
    }),
    onSuccess: () => {
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: ['planner-day'] });
      toast.success('Unscheduled task added');
    }
  });

  const assignToDateMutation = useMutation({
    mutationFn: ({ taskId, time }: { taskId: string; time: string }) => {
      const [h, m] = time.split(':').map(Number);
      const startAt = `${selectedDate}T${time}:00.000Z`;
      const endH = (h + 1) % 24;
      const endAt = `${selectedDate}T${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;

      return api.rescheduleTask(taskId, {
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        durationMinutes: 60
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-day'] });
      toast.success('Task scheduled onto timeline');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-day'] });
      toast.success('Task removed');
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    quickAddUnscheduled.mutate(newTitle.trim());
  };

  return (
    <div className="w-80 flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-card/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Unscheduled Queue
          </span>
          <Badge variant="outline" className="text-xs font-mono">
            {tasks.length}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Tasks awaiting a scheduled time slot.
        </p>

        {/* Quick add unscheduled */}
        <form onSubmit={handleAdd} className="mt-3 flex gap-1.5">
          <Input
            placeholder="Quick add to queue..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" className="h-8 px-2.5" disabled={quickAddUnscheduled.isPending}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-muted-foreground">Queue is empty.</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Add unscheduled tasks above or during task creation.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="p-2.5 rounded-lg border border-border bg-background shadow-xs hover:border-foreground/30 transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  onClick={() => setStatusModalTask(task)}
                  className="text-xs font-medium cursor-pointer hover:underline line-clamp-2"
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTaskMutation.mutate(task._id)}
                  className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Schedule to today */}
              <div className="flex items-center gap-1.5 pt-1">
                <Input
                  type="time"
                  defaultValue="14:00"
                  onChange={(e) => setScheduleTime({ ...scheduleTime, [task._id]: e.target.value })}
                  className="h-7 text-[11px] font-mono px-2 py-0"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    assignToDateMutation.mutate({
                      taskId: task._id,
                      time: scheduleTime[task._id] || '14:00'
                    })
                  }
                  className="h-7 px-2 text-xs gap-1 font-medium"
                  title="Schedule to today at this time"
                >
                  <span>Assign</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

