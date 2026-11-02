"use client";

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskStatus, ReasonCategory } from '@/types/api';
import { toast } from 'sonner';
import { CheckCircle2, Clock, XCircle, PieChart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const REASON_CATEGORIES: Array<{ value: ReasonCategory; label: string }> = [
  { value: 'DISTRACTION', label: 'Distraction (Social Media, Phone, etc.)' },
  { value: 'LOW_ENERGY', label: 'Low Energy / Fatigue' },
  { value: 'POOR_PLANNING', label: 'Poor Planning / Unrealistic Schedule' },
  { value: 'PROCRASTINATION', label: 'Procrastination / Resistance' },
  { value: 'UNEXPECTED_WORK', label: 'Unexpected Urgent Work' },
  { value: 'TIME_MISMANAGEMENT', label: 'Time Mismanagement' },
  { value: 'HEALTH_ISSUE', label: 'Health / Physical Issue' },
  { value: 'TECHNICAL_ISSUE', label: 'Technical Issue / Tools Broken' },
  { value: 'INSUFFICIENT_TIME', label: 'Insufficient Time Allocated' },
  { value: 'OTHER', label: 'Other Reason' },
];

export function TaskStatusModal() {
  const { statusModalTask, setStatusModalTask, selectedDate } = useUIStore();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('SUCCESS');
  const [reasonCategory, setReasonCategory] = useState<ReasonCategory>('DISTRACTION');
  const [actualReason, setActualReason] = useState('');
  const [actualDuration, setActualDuration] = useState<string>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (statusModalTask) {
      setSelectedStatus(statusModalTask.status || 'SUCCESS');
      setReasonCategory(statusModalTask.reasonCategory || 'DISTRACTION');
      setActualReason(statusModalTask.actualReason || '');
      setActualDuration(statusModalTask.durationMinutes ? String(statusModalTask.durationMinutes) : '');
      setNote('');
    }
  }, [statusModalTask]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!statusModalTask?._id) return;

      const payload: any = {
        status: selectedStatus,
        reasonCategory: (selectedStatus === 'FAILED' || selectedStatus === 'HALF') ? reasonCategory : null,
        actualReason: (selectedStatus === 'FAILED' || selectedStatus === 'HALF') ? (actualReason.trim() || null) : null,
        actualDurationMinutes: actualDuration ? parseInt(actualDuration, 10) : null,
        note: note.trim() || null
      };

      return api.updateTaskStatus(statusModalTask._id, payload);
    },
    onMutate: async () => {
      if (!statusModalTask?._id) return;
      const taskId = statusModalTask._id;
      const targetStatus = selectedStatus;

      // Close modal immediately for zero perceived latency
      setStatusModalTask(null);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['planner-day', selectedDate] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous states
      const previousSchedule = queryClient.getQueryData(['planner-day', selectedDate]);
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update planner-day
      queryClient.setQueryData(['planner-day', selectedDate], (old: any) => {
        if (!old) return old;
        const updateTaskItem = (t: any) => t._id === taskId ? { ...t, status: targetStatus } : t;
        const updatedAllScheduled = (old.allScheduled || []).map(updateTaskItem);
        const total = updatedAllScheduled.length;
        const successCount = updatedAllScheduled.filter((t: any) => t.status === 'SUCCESS').length;
        const halfCount = updatedAllScheduled.filter((t: any) => t.status === 'HALF').length;
        const failedCount = updatedAllScheduled.filter((t: any) => t.status === 'FAILED').length;
        const pendingCount = updatedAllScheduled.filter((t: any) => t.status === 'PENDING').length;
        const completionRate = total > 0 ? Math.round(((successCount + halfCount * 0.5) / total) * 100) : 0;

        return {
          ...old,
          metrics: {
            ...(old.metrics || {}),
            totalScheduled: total,
            successCount,
            halfCount,
            failedCount,
            pendingCount,
            completionRate
          },
          allScheduled: updatedAllScheduled,
          scheduled: {
            fixed: (old.scheduled?.fixed || []).map(updateTaskItem),
            flexible: (old.scheduled?.flexible || []).map(updateTaskItem),
            unplanned: (old.scheduled?.unplanned || []).map(updateTaskItem),
          },
          unscheduled: (old.unscheduled || []).map(updateTaskItem)
        };
      });

      // Optimistically update tasks list
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => t._id === taskId ? { ...t, status: targetStatus } : t);
      });

      return { previousSchedule, previousTasks };
    },
    onSuccess: () => {
      toast.success(`Task marked as ${selectedStatus}`);
    },
    onError: (err: any, _vars, context) => {
      toast.error(err.message || 'Failed to update task status');
      if (context?.previousSchedule) {
        queryClient.setQueryData(['planner-day', selectedDate], context.previousSchedule);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-day'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['weekly-review'], refetchType: 'active' });
    }
  });

  const handleClose = () => {
    setStatusModalTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatusMutation.mutate();
  };

  const isFrictionStatus = selectedStatus === 'FAILED' || selectedStatus === 'HALF';

  if (!statusModalTask) return null;

  return (
    <Dialog open={!!statusModalTask} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full sm:max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Record Task Outcome</DialogTitle>
          <p className="text-xs text-muted-foreground truncate font-mono">
            Task: {statusModalTask.title}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Status Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Outcome
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('SUCCESS')}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                  selectedStatus === 'SUCCESS'
                    ? "border-foreground bg-foreground text-background font-semibold shadow-sm"
                    : "border-border hover:bg-muted text-foreground"
                )}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Success</div>
                  <div className="text-[10px] opacity-75">Completed as planned</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('HALF')}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                  selectedStatus === 'HALF'
                    ? "border-foreground bg-foreground text-background font-semibold shadow-sm"
                    : "border-border hover:bg-muted text-foreground"
                )}
              >
                <PieChart className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Half</div>
                  <div className="text-[10px] opacity-75">Partially finished</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('FAILED')}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                  selectedStatus === 'FAILED'
                    ? "border-foreground bg-foreground text-background font-semibold shadow-sm"
                    : "border-border hover:bg-muted text-foreground"
                )}
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Failed</div>
                  <div className="text-[10px] opacity-75">Missed or blocked</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('PENDING')}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                  selectedStatus === 'PENDING'
                    ? "border-foreground bg-foreground text-background font-semibold shadow-sm"
                    : "border-border hover:bg-muted text-foreground"
                )}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Pending</div>
                  <div className="text-[10px] opacity-75">Keep in queue</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Reason Tracking for Failed & Half */}
          {isFrictionStatus && (
            <div className="space-y-3 rounded-lg border border-border p-3.5 bg-muted/20 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>Understand the obstacle</span>
              </div>

              {/* Predefined Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Predefined Category <span className="text-[10px] font-normal">(Powers Analytics)</span>
                </label>
                <Select value={reasonCategory} onValueChange={(v) => setReasonCategory(v as ReasonCategory)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Separate Handwritten Actual Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actual Reason <span className="text-[10px] font-normal">(Your Private Honest Log)</span>
                </label>
                <Textarea
                  placeholder="e.g. 'Spent one hour scrolling Instagram' or 'Network went down'"
                  value={actualReason}
                  onChange={(e) => setActualReason(e.target.value)}
                  className="bg-background min-h-[70px]"
                />
              </div>
            </div>
          )}

          {/* Optional Actual Duration and Note */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actual Duration (mins)
              </label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reflection Note (Optional)
              </label>
              <Input
                placeholder="Key takeaway..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={updateStatusMutation.isPending} className="w-full sm:w-auto">
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Outcome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

