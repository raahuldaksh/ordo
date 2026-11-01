"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Task, TaskStatus, TaskType, TaskPriority } from '@/types/api';
import { useUIStore } from '@/stores/uiStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTimeRange } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  PieChart,
  Search,
  MoreVertical,
  Copy,
  Archive,
  Trash2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function TasksPage() {
  const { setQuickAddOpen, setStatusModalTask } = useUIStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, typeFilter, priorityFilter],
    queryFn: () => {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.taskType = typeFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      return api.listTasks(params);
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.duplicateTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task duplicated');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.archiveTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task archived status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task permanently deleted');
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Task Directory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage, filter, and track execution outcomes across all tasks.
          </p>
        </div>

        <Button onClick={() => setQuickAddOpen(true)} className="gap-1.5 font-medium w-full sm:w-auto h-9 text-xs">
          <Plus className="h-4 w-4" /> Create Task
        </Button>
      </div>

      {/* Filter Bar: Row 1 Search, Row 2 Filters on mobile; 4-col on desktop */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 bg-card p-2.5 sm:p-3 rounded-xl border border-border shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 w-full"
          />
        </div>

        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs h-9 sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="HALF">Half</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="text-xs h-9 sm:w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="FIXED">Fixed</SelectItem>
              <SelectItem value="FLEXIBLE">Flexible</SelectItem>
              <SelectItem value="UNPLANNED">Unplanned</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="text-xs h-9 sm:w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-xs text-muted-foreground">
              No tasks match your selected criteria.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                >
                  <div
                    onClick={() => setStatusModalTask(task)}
                    className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="pt-0.5">
                      {task.status === 'SUCCESS' && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      {task.status === 'HALF' && <PieChart className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                      {task.status === 'FAILED' && <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                      {task.status === 'PENDING' && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-sm font-semibold truncate group-hover:underline">
                          {task.title}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {task.taskType}
                        </Badge>
                        <Badge
                          variant={task.status === 'SUCCESS' ? 'default' : 'outline'}
                          className={`text-[10px] uppercase font-mono ${
                            task.status === 'SUCCESS'
                              ? 'bg-emerald-600 text-white dark:bg-emerald-500 hover:bg-emerald-600'
                              : task.status === 'HALF'
                              ? 'text-amber-600 dark:text-amber-400 border-amber-500/40'
                              : task.status === 'FAILED'
                              ? 'text-rose-600 dark:text-rose-400 border-rose-500/40'
                              : ''
                          }`}
                        >
                          {task.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono hidden xs:inline-block">
                          {task.priority}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground font-mono">
                        <span>{formatTimeRange(task.scheduledStartAt, task.scheduledEndAt)}</span>
                        <span>•</span>
                        <span>{task.durationMinutes} mins</span>
                        {task.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-foreground/80">{task.tags.map(t => `#${t}`).join(' ')}</span>
                          </>
                        )}
                      </div>

                      {(task.reasonCategory || task.actualReason) && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive pt-0.5 font-mono">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-semibold">{task.reasonCategory}:</span>
                          <span className="italic truncate">{task.actualReason || 'No notes'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusModalTask(task)}
                      className="text-xs h-8 flex-1 sm:flex-initial"
                    >
                      Update Outcome
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 touch-manipulation">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(task._id)} className="gap-2 cursor-pointer">
                          <Copy className="h-3.5 w-3.5" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveMutation.mutate(task._id)} className="gap-2 cursor-pointer">
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate(task._id)}
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
