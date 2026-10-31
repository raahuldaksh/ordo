"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { RoutineTemplate, RoutineTemplateType, TaskType, ConflictStrategy } from '@/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Repeat, Calendar, Trash2, Copy, Play, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function RoutinesPage() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<RoutineTemplateType>('DAILY');
  const [templateDesc, setTemplateDesc] = useState('');

  // Item Modal
  const [activeTemplateForItems, setActiveTemplateForItems] = useState<RoutineTemplate | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState<TaskType>('FIXED');
  const [itemStart, setItemStart] = useState('08:00');
  const [itemEnd, setItemEnd] = useState('09:00');
  const [itemDayOfWeek, setItemDayOfWeek] = useState<number>(1);

  // Apply Modal
  const [applyTemplate, setApplyTemplate] = useState<RoutineTemplate | null>(null);
  const [applyStartDate, setApplyStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [applyEndDate, setApplyEndDate] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'));
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('SKIP');

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: () => api.listRoutines()
  });

  const createRoutineMutation = useMutation({
    mutationFn: () => api.createRoutine({
      name: templateName,
      templateType,
      description: templateDesc
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Routine created');
      setCreateOpen(false);
      setTemplateName('');
      setTemplateDesc('');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.duplicateRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Routine duplicated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Routine deleted');
    }
  });

  const addItemMutation = useMutation({
    mutationFn: () => {
      if (!activeTemplateForItems) throw new Error('No template selected');
      const [sh, sm] = itemStart.split(':').map(Number);
      const [eh, em] = itemEnd.split(':').map(Number);
      const duration = Math.max(15, (eh * 60 + em) - (sh * 60 + sm));

      return api.addRoutineItem(activeTemplateForItems._id, {
        title: itemTitle,
        taskType: itemType,
        startTimeLocal: itemStart,
        endTimeLocal: itemEnd,
        durationMinutes: duration,
        dayOfWeek: activeTemplateForItems.templateType === 'WEEKLY' ? itemDayOfWeek : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Routine item added');
      setItemTitle('');
      setActiveTemplateForItems(null);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ templateId, itemId }: { templateId: string; itemId: string }) =>
      api.deleteRoutineItem(templateId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      toast.success('Item removed');
    }
  });

  const applyRoutineMutation = useMutation({
    mutationFn: () => {
      if (!applyTemplate) throw new Error('No template selected');
      return api.applyRoutine(applyTemplate._id, {
        startDate: applyStartDate,
        endDate: applyEndDate,
        conflictStrategy
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planner-day'] });
      toast.success(
        `Routine applied: ${data.appliedCount} tasks generated (${data.skippedCount} skipped, ${data.replacedCount} replaced).`
      );
      setApplyTemplate(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to apply routine');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routine Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Design reusable daily rhythms and weekly schedules, then apply them with conflict resolution.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 font-medium">
          <Plus className="h-4 w-4" /> Create Routine
        </Button>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {routines.map((routine) => (
          <Card key={routine._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{routine.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {routine.description || 'No description provided'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {routine.templateType}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-y border-border/40 py-2">
                <span>{routine.items?.length || 0} scheduled blocks</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTemplateForItems(routine)}
                  className="h-7 text-xs gap-1 font-medium"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              {/* Items preview */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {routine.items?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/40 text-xs group"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {item.startTimeLocal} – {item.endTimeLocal} ({item.taskType})
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItemMutation.mutate({ templateId: routine._id, itemId: item._id })}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => duplicateMutation.mutate(routine._id)}
                  title="Duplicate routine"
                  className="h-8 w-8"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(routine._id)}
                  title="Delete routine"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Button
                size="sm"
                onClick={() => setApplyTemplate(routine)}
                className="gap-1.5 font-medium text-xs h-8"
              >
                <Play className="h-3.5 w-3.5" /> Apply to Dates
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create Routine Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>New Routine Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Name</label>
              <Input
                placeholder="e.g. Focused Morning Protocol"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Type</label>
              <Select value={templateType} onValueChange={(v) => setTemplateType(v as RoutineTemplateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily (Applies to any day)</SelectItem>
                  <SelectItem value="WEEKLY">Weekly (Includes weekday specific slots)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
              <Input
                placeholder="Brief purpose of this routine..."
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createRoutineMutation.mutate()} disabled={!templateName.trim() || createRoutineMutation.isPending}>
              Create Routine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={!!activeTemplateForItems} onOpenChange={(open) => !open && setActiveTemplateForItems(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Routine Time Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Title</label>
              <Input
                placeholder="e.g. Deep Work: Algorithm Practice"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Task Type</label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixed (Commitment)</SelectItem>
                  <SelectItem value="FLEXIBLE">Flexible (Focus Block)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Start Time</label>
                <Input type="time" value={itemStart} onChange={(e) => setItemStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">End Time</label>
                <Input type="time" value={itemEnd} onChange={(e) => setItemEnd(e.target.value)} />
              </div>
            </div>

            {activeTemplateForItems?.templateType === 'WEEKLY' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Day of Week</label>
                <Select value={String(itemDayOfWeek)} onValueChange={(v) => setItemDayOfWeek(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveTemplateForItems(null)}>Cancel</Button>
            <Button onClick={() => addItemMutation.mutate()} disabled={!itemTitle.trim() || addItemMutation.isPending}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Routine Dialog */}
      <Dialog open={!!applyTemplate} onOpenChange={(open) => !open && setApplyTemplate(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Apply Routine: {applyTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</label>
                <Input type="date" value={applyStartDate} onChange={(e) => setApplyStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">End Date</label>
                <Input type="date" value={applyEndDate} onChange={(e) => setApplyEndDate(e.target.value)} />
              </div>
            </div>

            {/* Conflict Strategy per PRD §8.6 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Conflict Strategy (PRD §8.6)
              </label>
              <Select value={conflictStrategy} onValueChange={(v) => setConflictStrategy(v as ConflictStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SKIP">Skip Conflicts (Preserve existing tasks)</SelectItem>
                  <SelectItem value="APPEND">Append (Allow overlapping tasks)</SelectItem>
                  <SelectItem value="REPLACE_CONFIRMED">Replace (Overwrite conflicting tasks)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground pt-1">
                ORDO ensures your existing tasks are never silently overwritten without your explicit choice.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTemplate(null)}>Cancel</Button>
            <Button onClick={() => applyRoutineMutation.mutate()} disabled={applyRoutineMutation.isPending}>
              {applyRoutineMutation.isPending ? 'Applying...' : 'Apply Routine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

