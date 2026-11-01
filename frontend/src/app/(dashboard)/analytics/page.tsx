"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, AlertCircle, Clock, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const fromStr = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
  const toStr = format(new Date(), 'yyyy-MM-dd');

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['analytics-summary', fromStr, toStr],
    queryFn: () => api.getAnalyticsSummary(fromStr, toStr)
  });

  const { data: reasons, isLoading: isReasonsLoading } = useQuery({
    queryKey: ['analytics-reasons', fromStr, toStr],
    queryFn: () => api.getReasonAnalytics(fromStr, toStr)
  });

  const completionRate = summary?.completionRate !== null && summary?.completionRate !== undefined
    ? `${summary.completionRate}%`
    : 'No data';

  const typeData = [
    { name: 'Fixed', value: summary?.typeBreakdown?.fixed || 0 },
    { name: 'Flexible', value: summary?.typeBreakdown?.flexible || 0 },
    { name: 'Unplanned', value: summary?.typeBreakdown?.unplanned || 0 },
  ];

  const categoryData = reasons?.categoryBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productivity Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Understand completion fidelity, time accuracy, and root causes of missed tasks.
          </p>
        </div>

        {/* Range Selector */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex rounded-lg border border-border p-0.5 bg-card">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRange(r)}
              className="h-8 px-2 sm:px-3 text-xs font-mono font-medium uppercase"
            >
              Last {r.replace('d', ' Days')}
            </Button>
          ))}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-mono font-semibold uppercase">
              Completion Rate
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {completionRate}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Success / eligible planned tasks
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-mono font-semibold uppercase">
              Planned Duration
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {summary?.plannedHours || 0} hrs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Across {summary?.totalPlanned || 0} tasks
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-mono font-semibold uppercase">
              Half (Partial)
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {summary?.halfCount || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Reported separately from full success
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-mono font-semibold uppercase">
              Friction Events
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">
              {reasons?.totalReasonRecorded || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Categorized missed commitments
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Daily Completion Trend (%)
            </CardTitle>
            <CardDescription className="text-xs">
              Daily percentage of scheduled tasks marked Success.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {summary?.trend && summary.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.trend}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="completionRate" stroke="currentColor" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No trend data for this period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reason Categories Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Missed Task Obstacles (PRD §8.4)
            </CardTitle>
            <CardDescription className="text-xs">
              Predefined obstacle categories recorded for Failed and Half tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis dataKey="category" type="category" stroke="#888888" fontSize={9} width={90} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="currentColor" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No failure reasons recorded in this timeframe. Excellent execution!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekday Productivity Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Productivity by Weekday
            </CardTitle>
            <CardDescription className="text-xs">
              Identify your most and least productive days of the week.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            {summary?.weekdayBreakdown ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.weekdayBreakdown}>
                  <XAxis dataKey="dayName" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="completionRate" fill="currentColor" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No weekday breakdown available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Type Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Task Type Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Balance between Fixed commitments, Flexible focus blocks, and Unplanned tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {typeData.some(d => d.value > 0) ? (
              <div className="w-full flex items-center justify-around">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                        <Cell fill="hsl(var(--foreground))" />
                        <Cell fill="hsl(var(--muted-foreground))" />
                        <Cell fill="hsl(var(--border))" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
                    <span>Fixed: {summary?.typeBreakdown?.fixed || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                    <span>Flexible: {summary?.typeBreakdown?.flexible || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-foreground" />
                    <span>Unplanned: {summary?.typeBreakdown?.unplanned || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No task data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actual Reason Reflection Feed (PRD §8.4 & §8.7) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Honest Reflection Log</CardTitle>
          <CardDescription className="text-xs">
            Handwritten Actual Reasons recorded when tasks were missed or partially executed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!reasons?.actualReasonLogs || reasons.actualReasonLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No handwritten reflection notes recorded in this period.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {reasons.actualReasonLogs.map((log, index) => (
                <div key={index} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.category}
                      </Badge>
                      <Badge variant={log.status === 'FAILED' ? 'destructive' : 'outline'} className="text-[10px] font-mono">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground">
                      "{log.reason}"
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {format(new Date(log.date), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

