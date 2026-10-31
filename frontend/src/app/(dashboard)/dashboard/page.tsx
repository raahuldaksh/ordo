"use client";

import React from 'react';
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
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { selectedDate, setQuickAddOpen, setStatusModalTask } = useUIStore();
  const { user } = useAuth();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['planner-day', selectedDate],
    queryFn: () => api.getDaySchedule(selectedDate)
  });

  const { data: aiInsights = [] } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.listAiInsights()
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

  const tasks = schedule?.allScheduled || [];
  const latestInsight = aiInsights.length > 0 ? aiInsights[0] : null;

  const plannedHours = Number((metrics.plannedMinutes / 60).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">
            Planning for {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/my-day">
            <Button variant="outline" size="sm" className="gap-1.5 font-medium">
              <Clock className="h-4 w-4" /> Open 24h Planner
            </Button>
          </Link>
          <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1.5 font-medium">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Planned Tasks */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
              Total Planned
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.totalScheduled}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground font-mono">
            {plannedHours} planned hours
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
              Completion Rate
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.completionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Progress value={metrics.completionRate} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        {/* Success vs Half */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
              Success / Half
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.successCount} <span className="text-muted-foreground text-lg">/ {metrics.halfCount}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Fully vs partially executed
          </CardContent>
        </Card>

        {/* Failed / Missed */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold tracking-wider font-mono">
              Failed / Blocked
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {metrics.failedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {metrics.failedCount > 0 ? 'Friction recorded' : 'Zero missed tasks'}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Tasks Timeline Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Today's Schedule</CardTitle>
                <CardDescription className="text-xs">
                  Tasks scheduled for execution on the 24-hour timeline.
                </CardDescription>
              </div>
              <Link href="/my-day" className="text-xs font-medium hover:underline flex items-center gap-1">
                View Timeline <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-medium">No tasks planned for today.</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Design your realistic 24-hour day by scheduling commitments, flexible deep work, or applying a routine.
                  </p>
                  <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1 mt-2">
                    <Plus className="h-4 w-4" /> Schedule First Task
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setStatusModalTask(task)}
                      className="py-3 flex items-center justify-between gap-3 group cursor-pointer hover:bg-muted/40 rounded-lg px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {task.status === 'SUCCESS' && <CheckCircle2 className="h-4 w-4 text-foreground shrink-0" />}
                        {task.status === 'HALF' && <PieChart className="h-4 w-4 text-foreground shrink-0" />}
                        {task.status === 'FAILED' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                        {task.status === 'PENDING' && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:underline">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">
                              {formatTimeRange(task.scheduledStartAt, task.scheduledEndAt)}
                            </span>
                            <span>•</span>
                            <span>{task.durationMinutes}m</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {task.taskType}
                        </Badge>
                        <Badge
                          variant={task.status === 'SUCCESS' ? 'default' : 'outline'}
                          className="text-[10px] uppercase font-mono"
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
        </div>

        {/* Right Column: AI Assistant Insight & Quick Shortcuts */}
        <div className="space-y-4">
          {/* AI Productivity Insight Card */}
          <Card className="border-border bg-card/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Sparkles className="h-24 w-24" />
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider font-mono">
                  Advisory Insight
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestInsight ? (
                <>
                  <p className="text-xs font-semibold leading-snug">
                    {latestInsight.content.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {latestInsight.content.summary}
                  </p>
                  <Link href="/ai-assistant">
                    <Button variant="outline" size="sm" className="w-full text-xs font-medium mt-2">
                      View Full Analysis & Tips
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    ORDO learns from your task outcomes and obstacles to provide tailored schedule recommendations.
                  </p>
                  <Link href="/ai-assistant">
                    <Button variant="outline" size="sm" className="w-full text-xs font-medium">
                      Generate First AI Insight
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Productivity Navigation Hub */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider font-mono">
                Productivity Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/routines"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Routine Templates</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/analytics"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <span>Productivity Analytics & Reasons</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/weekly-review"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                  <span>Weekly Review Reflection</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

