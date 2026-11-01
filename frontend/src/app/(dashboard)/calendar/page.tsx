"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  ExternalLink
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import { toast } from 'sonner';

export default function CalendarPage() {
  const { setSelectedDate, setQuickAddOpen } = useUIStore();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch connections
  const { data: connections = [] } = useQuery({
    queryKey: ['calendar-connections'],
    queryFn: () => api.getCalendarConnections()
  });

  // Calculate range bounds
  let rangeStart = currentDate;
  let rangeEnd = currentDate;

  if (view === 'day') {
    rangeStart = currentDate;
    rangeEnd = currentDate;
  } else if (view === 'week') {
    rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  } else if (view === 'month') {
    rangeStart = startOfMonth(currentDate);
    rangeEnd = endOfMonth(currentDate);
  }

  const fromStr = rangeStart.toISOString();
  const toStr = rangeEnd.toISOString();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', fromStr, toStr],
    queryFn: () => api.getCalendarEvents(fromStr, toStr)
  });

  const syncMutation = useMutation({
    mutationFn: (connectionId: string) => api.syncCalendar(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Calendar synchronized');
    }
  });

  const connectGoogleMutation = useMutation({
    mutationFn: () => api.connectGoogleCalendar('dev_oauth_code'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Google Calendar connected');
    }
  });

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
  };

  const googleConnection = connections.find(c => c.provider === 'GOOGLE');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unified view of ORDO scheduled commitments and external calendar events.
          </p>
        </div>

        {/* View Switcher and Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex rounded-lg border border-border p-0.5 bg-card">
            {(['day', 'week', 'month'] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(v)}
                className="h-8 px-2.5 sm:px-3 text-xs capitalize font-medium"
              >
                {v}
              </Button>
            ))}
          </div>

          <Button size="sm" onClick={() => setQuickAddOpen(true)} className="gap-1.5 font-medium h-8 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </div>
      </div>

      {/* Google Calendar Integration Sync Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border border-border bg-card/60 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-foreground shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Google Calendar Integration: </span>
            {googleConnection ? (
              <span className="text-muted-foreground">
                Connected ({googleConnection.syncMode} mode). Last synced{' '}
                {googleConnection.lastSyncedAt
                  ? format(new Date(googleConnection.lastSyncedAt), 'MMM d, HH:mm')
                  : 'recently'}
              </span>
            ) : (
              <span className="text-muted-foreground">Not connected yet.</span>
            )}
          </div>
        </div>

        <div>
          {googleConnection ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate(googleConnection._id)}
              disabled={syncMutation.isPending}
              className="text-xs h-8 gap-1.5 font-medium w-full sm:w-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => connectGoogleMutation.mutate()}
              disabled={connectGoogleMutation.isPending}
              className="text-xs h-8 gap-1.5 font-medium w-full sm:w-auto"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>

      {/* Date Header Controller */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 px-2.5 text-xs font-medium">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-xs sm:text-sm font-semibold ml-1 sm:ml-2 font-mono">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Calendar Grid Views */}
      {view === 'week' && (
        <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[700px] md:min-w-0">
            {eachDayOfInterval({
              start: startOfWeek(currentDate, { weekStartsOn: 1 }),
              end: endOfWeek(currentDate, { weekStartsOn: 1 })
            }).map((day, idx) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), day));
              const isCurrentDay = isSameDay(day, new Date());

              return (
                <Card
                  key={idx}
                  className={`min-h-[380px] sm:min-h-[420px] flex flex-col ${isCurrentDay ? 'border-foreground shadow-sm' : ''}`}
                >
                  <div
                    onClick={() => {
                      setSelectedDate(dayKey);
                    }}
                    className="p-2 sm:p-3 border-b border-border/60 bg-muted/20 flex flex-col items-center cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                      {format(day, 'EEE')}
                    </span>
                    <span
                      className={`text-sm font-bold mt-0.5 h-6 w-6 rounded-full flex items-center justify-center ${
                        isCurrentDay ? 'bg-foreground text-background' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="flex-1 p-1.5 sm:p-2 space-y-1.5 overflow-y-auto">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-1.5 sm:p-2 rounded-md border text-xs space-y-0.5 ${
                          event.source === 'GOOGLE'
                            ? 'border-dashed border-border bg-muted/30'
                            : 'border-border bg-card shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate text-[11px] sm:text-xs">{event.title}</span>
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-mono shrink-0">
                            {event.source}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {format(parseISO(event.start), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {view === 'month' && (
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 no-scrollbar">
            <div className="grid grid-cols-7 gap-1 min-w-[580px] md:min-w-0">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="p-1.5 sm:p-2 text-center text-xs font-semibold uppercase text-muted-foreground font-mono">
                  {day}
                </div>
              ))}

              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
                end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
              }).map((day, idx) => {
                const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), day));
                const isCurrMonth = isSameMonth(day, currentDate);
                const isTodayDay = isSameDay(day, new Date());

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                    className={`min-h-[75px] sm:min-h-[90px] p-1.5 sm:p-2 border border-border/40 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors ${
                      !isCurrMonth ? 'opacity-30' : ''
                    } ${isTodayDay ? 'border-foreground font-bold' : ''}`}
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={isTodayDay ? 'text-foreground underline' : 'text-muted-foreground'}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{dayEvents.length}</span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-muted">
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-muted-foreground font-mono">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {view === 'day' && (
        <Card className="p-4 sm:p-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold font-mono">Events for {format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events on this date.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {events.map((ev) => (
                  <div key={ev.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{ev.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {format(parseISO(ev.start), 'HH:mm')} – {format(parseISO(ev.end), 'HH:mm')}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">{ev.source}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
