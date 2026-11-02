"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatTimeRange } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  PieChart,
  ArrowRight,
  Sparkles,
  CalendarDays,
  BarChart2,
  BookOpenCheck,
  Plus,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowUpRight,
  Flame,
  Check,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addDays
} from 'date-fns';

export default function DashboardPage() {
  const { selectedDate, setSelectedDate, setQuickAddOpen, setStatusModalTask } = useUIStore();
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed'>('all');

  const parsedSelectedDate = parseISO(selectedDate);

  // 1. Daily Schedule Query
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['planner-day', selectedDate],
    queryFn: () => api.getDaySchedule(selectedDate)
  });

  // 2. AI Insights Query
  const { data: aiInsights = [] } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.listAiInsights()
  });

  // 3. Calendar Events Query for Today
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['calendar-events-today', selectedDate],
    queryFn: () => {
      const from = `${selectedDate}T00:00:00.000Z`;
      const to = `${selectedDate}T23:59:59.999Z`;
      return api.getCalendarEvents(from, to);
    }
  });

  const tasks = schedule?.allScheduled || [];

  // Derive metrics reactively from current tasks for instant zero-latency UI synchronization
  const metrics = React.useMemo(() => {
    const rawMetrics = schedule?.metrics || {
      totalScheduled: 0,
      successCount: 0,
      pendingCount: 0,
      failedCount: 0,
      halfCount: 0,
      completionRate: 0,
      plannedMinutes: 0
    };

    if (!tasks.length) return rawMetrics;

    const total = tasks.length;
    const successCount = tasks.filter((t) => t.status === 'SUCCESS').length;
    const halfCount = tasks.filter((t) => t.status === 'HALF').length;
    const failedCount = tasks.filter((t) => t.status === 'FAILED').length;
    const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
    const completionRate = total > 0 ? Math.round(((successCount + halfCount * 0.5) / total) * 100) : 0;
    const plannedMinutes = tasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0) || rawMetrics.plannedMinutes;

    return {
      ...rawMetrics,
      totalScheduled: total,
      successCount,
      halfCount,
      failedCount,
      pendingCount,
      completionRate,
      plannedMinutes
    };
  }, [schedule?.metrics, tasks]);
  const latestInsight = aiInsights.length > 0 ? aiInsights[0] : null;
  const plannedHours = Number((metrics.plannedMinutes / 60).toFixed(1));

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter((task) => {
    if (filterTab === 'pending') return task.status === 'PENDING';
    if (filterTab === 'completed') return task.status === 'SUCCESS' || task.status === 'HALF' || task.status === 'FAILED';
    return true;
  });

  // Determine current or upcoming task
  const currentOrNextTask = tasks.find((t) => t.status === 'PENDING') || tasks[tasks.length - 1];

  // Dynamic Greeting based on client hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Member';

  // Compute 7-day consistency strip for current week
  const weekStart = startOfWeek(parsedSelectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Helper to map occupied hours for the 24h compact timeline bar
  const hourOccupancy = Array(24).fill(0);
  tasks.forEach((t) => {
    if (t.scheduledStartAt && t.scheduledEndAt) {
      try {
        const startH = new Date(t.scheduledStartAt).getUTCHours();
        const endH = new Date(t.scheduledEndAt).getUTCHours();
        for (let h = startH; h <= Math.min(endH, 23); h++) {
          hourOccupancy[h] += 1;
        }
      } catch {
        // ignore date parse edge cases
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Welcome & Daily Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, {firstName}
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider hidden sm:inline-flex">
              Intentional OS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {format(parsedSelectedDate, 'EEEE, MMMM d, yyyy')} • Plan with discipline, execute with intent.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/my-day">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
              <Clock className="h-4 w-4" /> Open 24h Planner
            </Button>
          </Link>
          <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1.5 text-xs font-semibold h-9 shadow-xs">
            <Plus className="h-4 w-4" /> Quick Add Task
          </Button>
        </div>
      </div>

      {/* 2. Hero Action: Continue Your Day Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card/60 backdrop-blur-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-hover">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono uppercase font-semibold text-muted-foreground tracking-wider">
              {currentOrNextTask && currentOrNextTask.status === 'PENDING' ? 'Next Commitment' : 'Day Overview'}
            </span>
          </div>

          {currentOrNextTask ? (
            <div>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {currentOrNextTask.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                <span>
                  {formatTimeRange(currentOrNextTask.scheduledStartAt, currentOrNextTask.scheduledEndAt)}
                </span>
                <span>•</span>
                <span>{currentOrNextTask.durationMinutes} minutes</span>
                <span>•</span>
                <span className="uppercase text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40">
                  {currentOrNextTask.taskType}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm sm:text-base font-bold text-foreground">
                No active commitments scheduled for today.
              </p>
              <p className="text-xs text-muted-foreground">
                Position your immovable meetings or apply your baseline routine template.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {currentOrNextTask && currentOrNextTask.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatusModalTask(currentOrNextTask)}
              className="text-xs font-medium h-9 w-full sm:w-auto"
            >
              Record Outcome
            </Button>
          )}
          <Link href="/my-day" className="w-full sm:w-auto">
            <Button size="sm" className="text-xs font-semibold h-9 w-full sm:w-auto gap-1.5 shadow-xs">
              <span>View 24h Timeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. KPI Metric Cards Grid ("Today at a Glance") */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Planned Tasks */}
        <Card className="card-hover">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
                Total Planned
              </CardDescription>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.totalScheduled}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground font-mono">
            {plannedHours} scheduled hours
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card className="card-hover">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
                Completion Rate
              </CardDescription>
              <span className="text-xs font-mono font-bold text-foreground">
                {metrics.completionRate}%
              </span>
            </div>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.successCount + metrics.halfCount} / {metrics.totalScheduled}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Progress value={metrics.completionRate} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        {/* Success vs Half */}
        <Card className="card-hover">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
                Success / Partial
              </CardDescription>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono flex items-baseline gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400">{metrics.successCount}</span>
              <span className="text-muted-foreground text-sm font-normal">/</span>
              <span className="text-amber-600 dark:text-amber-400">{metrics.halfCount}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Fully vs. partially executed
          </CardContent>
        </Card>

        {/* Failed / Blocked */}
        <Card className="card-hover">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
                Failed / Blocked
              </CardDescription>
              {metrics.failedCount > 0 ? (
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
              ) : (
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.failedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {metrics.failedCount > 0 ? 'Friction recorded' : 'Zero friction recorded'}
          </CardContent>
        </Card>
      </div>

      {/* 4. Compact 24-Hour Visual Density Strip */}
      <Card className="p-4 space-y-2 card-hover">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground" />
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              24-Hour Schedule Density Strip
            </span>
          </span>
          <Link href="/my-day" className="hover:text-foreground hover:underline flex items-center gap-1 text-[11px]">
            Full Timeline <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 24 Hour blocks */}
        <div className="flex items-center gap-0.5 sm:gap-1 h-5 pt-1 w-full">
          {hourOccupancy.map((count, h) => (
            <div
              key={h}
              title={`${h.toString().padStart(2, '0')}:00 — ${count > 0 ? `${count} task(s)` : 'Available'}`}
              className={`flex-1 h-full rounded-xs transition-colors cursor-pointer ${
                count > 0
                  ? 'bg-foreground hover:bg-foreground/80'
                  : 'bg-muted/40 hover:bg-muted/70'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </Card>

      {/* 5. Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Task List & Weekly Consistency Strip */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Card */}
          <Card>
            <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold">Today's Schedule</CardTitle>
                <CardDescription className="text-xs">
                  Tasks and focus blocks mapped for {format(parsedSelectedDate, 'MMMM d')}.
                </CardDescription>
              </div>

              {/* Filter tabs */}
              <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/30 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterTab === 'all'
                      ? 'bg-background text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('pending')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterTab === 'pending'
                      ? 'bg-background text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pending ({metrics.pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('completed')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterTab === 'completed'
                      ? 'bg-background text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Done ({metrics.successCount + metrics.halfCount + metrics.failedCount})
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-medium">No tasks found for this view.</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {filterTab === 'all'
                      ? 'Design your realistic 24-hour day by scheduling commitments or applying a routine template.'
                      : `You have no ${filterTab} tasks for today.`}
                  </p>
                  <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1 mt-2 text-xs font-medium">
                    <Plus className="h-3.5 w-3.5" /> Schedule Task
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setStatusModalTask(task)}
                      className="py-3 flex items-center justify-between gap-3 group cursor-pointer hover:bg-muted/40 rounded-lg px-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {task.status === 'SUCCESS' && (
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        {task.status === 'HALF' && (
                          <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <PieChart className="h-4 w-4" />
                          </div>
                        )}
                        {task.status === 'FAILED' && (
                          <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <XCircle className="h-4 w-4" />
                          </div>
                        )}
                        {task.status === 'PENDING' && (
                          <div className="h-7 w-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:underline">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                            <span>
                              {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt)}
                            </span>
                            <span>•</span>
                            <span>{task.durationMinutes}m</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono hidden sm:inline-block">
                          {task.taskType}
                        </Badge>
                        <Badge
                          variant={task.status === 'SUCCESS' ? 'default' : 'outline'}
                          className={`text-[10px] uppercase font-mono ${
                            task.status === 'SUCCESS'
                              ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                              : task.status === 'HALF'
                              ? 'text-amber-600 dark:text-amber-400 border-amber-500/40'
                              : task.status === 'FAILED'
                              ? 'text-rose-600 dark:text-rose-400 border-rose-500/40'
                              : ''
                          }`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Consistency Strip */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Weekly Consistency Strip</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Week of {format(weekStart, 'MMMM d, yyyy')}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono uppercase">
                7 Days
              </Badge>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-1">
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, parsedSelectedDate);
                const isCurrent = isToday(day);

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => setSelectedDate(dayStr)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-foreground bg-foreground text-background shadow-xs font-semibold'
                        : isCurrent
                        ? 'border-foreground/40 bg-muted/30 text-foreground'
                        : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase block">
                      {format(day, 'EEE')}
                    </span>
                    <span className="text-sm font-bold font-mono block mt-0.5">
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Next Calendar Event, AI Advisory, Shortcuts */}
        <div className="space-y-6">
          {/* Upcoming Calendar Events Card */}
          <Card className="card-hover">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-foreground" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider font-mono">
                    External Calendar
                  </CardTitle>
                </div>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground">
                    Connect
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {calendarEvents.length === 0 ? (
                <div className="py-5 text-center space-y-2 border border-dashed border-border/80 rounded-lg">
                  <CalendarIcon className="h-5 w-5 mx-auto text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No synced external calendar events for today.
                  </p>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="h-7 text-xs font-medium mt-1">
                      Sync Calendar
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {calendarEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{event.title}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {formatTimeRange(event.start, event.end)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {event.source || 'Synced'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Advisory Insight Card */}
          <Card className="border-border bg-card/60 relative overflow-hidden card-hover">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <Sparkles className="h-20 w-20" />
            </div>
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider font-mono">
                  Advisory Insight
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {latestInsight ? (
                <>
                  <p className="text-xs font-semibold leading-snug">
                    {latestInsight.content.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {latestInsight.content.summary}
                  </p>
                  <Link href="/ai-assistant">
                    <Button variant="outline" size="sm" className="w-full text-xs font-medium mt-1">
                      View Full Analysis & Tips
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ORDO tracks outcomes and obstacles to uncover friction patterns and suggest schedule optimizations.
                  </p>
                  <Link href="/ai-assistant">
                    <Button variant="outline" size="sm" className="w-full text-xs font-medium mt-1">
                      Generate First AI Insight
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Productivity Hub Navigation */}
          <Card className="card-hover">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider font-mono">
                Productivity Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              <Link
                href="/routines"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Routine Templates</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/analytics"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <span>Productivity Analytics & Reasons</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/weekly-review"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Weekly Review Reflection</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
