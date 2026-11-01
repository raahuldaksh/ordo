"use client";

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TaskType, TaskPriority } from '@/types/api';
import { toast } from 'sonner';
import { AlertCircle, Clock, Tag } from 'lucide-react';

export function QuickAddTaskModal() {
  const { isQuickAddOpen, setQuickAddOpen, selectedDate, quickAddInitialTime, setQuickAddInitialTime } = useUIStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('FLEXIBLE');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [isScheduled, setIsScheduled] = useState(true);
  const [startTime, setStartTime] = useState(quickAddInitialTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [tagsInput, setTagsInput] = useState('');
  const [overlapWarning, setOverlapWarning] = useState<any[] | null>(null);

  // Sync initial time when set from timeline slot click
  React.useEffect(() => {
    if (quickAddInitialTime) {
      setStartTime(quickAddInitialTime);
      const [h, m] = quickAddInitialTime.split(':').map(Number);
      const endH = (h + 1) % 24;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      setIsScheduled(true);
    }
  }, [quickAddInitialTime]);

  const createTaskMutation = useMutation({
    mutationFn: async (allowOverlap: boolean = false) => {
      let scheduledStartAt: string | null = null;
      let scheduledEndAt: string | null = null;
      let durationMinutes = 30;

      if (isScheduled) {
        scheduledStartAt = `${selectedDate}T${startTime}:00.000Z`;
        scheduledEndAt = `${selectedDate}T${endTime}:00.000Z`;
        const start = new Date(scheduledStartAt);
        const end = new Date(scheduledEndAt);
        durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));

        // Overlap verification check matching PRD §8.2 & §11.4
        if (!allowOverlap) {
          const overlapCheck = await api.checkOverlaps(scheduledStartAt, scheduledEndAt);
          if (overlapCheck.hasOverlap) {
            setOverlapWarning(overlapCheck.conflicts);
            throw new Error('OVERLAP_DETECTED');
          }
        }
      }

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      return api.createTask({
        title,
        description,
        taskType,
        priority,
        scheduledStartAt,
        scheduledEndAt,
        durationMinutes,
        tags
      });
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['planner-day'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleClose();
    },
    onError: (err: any) => {
      if (err.message !== 'OVERLAP_DETECTED') {
        toast.error(err.message || 'Failed to create task');
      }
    }
  });

  const handleClose = () => {
    setQuickAddOpen(false);
    setTitle('');
    setDescription('');
    setTaskType('FLEXIBLE');
    setPriority('MEDIUM');
    setTagsInput('');
    setOverlapWarning(null);
    setQuickAddInitialTime(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    createTaskMutation.mutate(false);
  };

  const handleConfirmOverlap = () => {
    setOverlapWarning(null);
    createTaskMutation.mutate(true);
  };

  return (
    <Dialog open={isQuickAddOpen} onOpenChange={setQuickAddOpen}>
      <DialogContent className="w-full sm:max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Create New Task</DialogTitle>
        </DialogHeader>

        {overlapWarning ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <AlertCircle className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Schedule Overlap Detected</p>
                <p className="text-xs text-muted-foreground">
                  The selected time slot conflicts with {overlapWarning.length} existing scheduled task:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground pt-1 space-y-0.5">
                  {overlapWarning.map((c, i) => (
                    <li key={i} className="font-mono">
                      {c.title} ({c.taskType})
                    </li>
                  ))}
                </ul>
                <p className="text-xs pt-1">
                  Do you want to confirm this intentional overlap?
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOverlapWarning(null)}>
                Adjust Times
              </Button>
              <Button
                type="button"
                onClick={handleConfirmOverlap}
                disabled={createTaskMutation.isPending}
              >
                Confirm Intentional Overlap
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="What needs to get done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Add context, links, or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Type
                </label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed (Commitment)</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible (Focus Block)</SelectItem>
                    <SelectItem value="UNPLANNED">Unplanned (Interruption)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Schedule on Timeline</label>
                <p className="text-xs text-muted-foreground">
                  {isScheduled ? `Scheduled on ${selectedDate}` : 'Add to unscheduled queue'}
                </p>
              </div>
              <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
            </div>

            {/* Time Slot Inputs */}
            {isScheduled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Start Time
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> End Time
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Tags (comma-separated)
              </label>
              <Input
                placeholder="work, health, study..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending} className="w-full sm:w-auto">
                {createTaskMutation.isPending ? 'Saving...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

