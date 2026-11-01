"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from 'date-fns';
import { BookOpenCheck, CheckCircle2, Trophy, AlertTriangle, ArrowRight, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function WeeklyReviewPage() {
  const queryClient = useQueryClient();

  // Current review week (defaults to past week)
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    format(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );

  const weekStart = parseISO(selectedWeekStart);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Load previous reviews
  const { data: pastReviews = [] } = useQuery({
    queryKey: ['weekly-reviews'],
    queryFn: () => api.listWeeklyReviews()
  });

  // Load analytics snapshot for the week
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', selectedWeekStart, weekEndStr],
    queryFn: () => api.getAnalyticsSummary(selectedWeekStart, weekEndStr)
  });

  const { data: reasons } = useQuery({
    queryKey: ['analytics-reasons', selectedWeekStart, weekEndStr],
    queryFn: () => api.getReasonAnalytics(selectedWeekStart, weekEndStr)
  });

  // Form states
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextWeekChanges, setNextWeekChanges] = useState('');

  // Check if this week already has a saved review
  const existingReview = pastReviews.find(
    (r) => format(new Date(r.weekStartDate), 'yyyy-MM-dd') === selectedWeekStart
  );

  React.useEffect(() => {
    if (existingReview) {
      setWins(existingReview.wins || '');
      setChallenges(existingReview.challenges || '');
      setNextWeekChanges(existingReview.nextWeekChanges || '');
    } else {
      setWins('');
      setChallenges('');
      setNextWeekChanges('');
    }
  }, [existingReview, selectedWeekStart]);

  const saveReviewMutation = useMutation({
    mutationFn: () => {
      const topReasons = (reasons?.categoryBreakdown || []).slice(0, 3).map(r => r.category);
      return api.createWeeklyReview({
        weekStartDate: `${selectedWeekStart}T00:00:00.000Z`,
        weekEndDate: `${weekEndStr}T23:59:59.999Z`,
        wins,
        challenges,
        recurringReasons: topReasons,
        nextWeekChanges
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-reviews'] });
      toast.success('Weekly review saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save weekly review');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly Review</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reflect on what worked, understand missed commitments, and set adjustments for next week.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => saveReviewMutation.mutate()}
            disabled={saveReviewMutation.isPending}
            className="gap-1.5 font-medium w-full sm:w-auto h-9 text-xs"
          >
            <Save className="h-4 w-4" />
            {saveReviewMutation.isPending ? 'Saving...' : 'Save Review'}
          </Button>
        </div>
      </div>

      {/* Week Selection & Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Reviewing Week
            </span>
            <p className="text-sm font-bold font-mono">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>

          <div className="pt-3">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Past Reviews</span>
            <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
              {pastReviews.map((rev) => {
                const dateLabel = format(new Date(rev.weekStartDate), 'MMM d, yyyy');
                return (
                  <div
                    key={rev._id}
                    onClick={() => setSelectedWeekStart(format(new Date(rev.weekStartDate), 'yyyy-MM-dd'))}
                    className={`text-xs p-1.5 rounded cursor-pointer hover:bg-muted font-mono truncate ${
                      format(new Date(rev.weekStartDate), 'yyyy-MM-dd') === selectedWeekStart
                        ? 'bg-muted font-bold text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Week of {dateLabel}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Snapshot Cards */}
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Completion Fidelity
          </span>
          <div className="text-2xl font-bold font-mono">
            {summary?.completionRate !== null && summary?.completionRate !== undefined
              ? `${summary.completionRate}%`
              : '0%'}
          </div>
          <span className="text-xs text-muted-foreground">
            {summary?.successCount || 0} successes / {summary?.totalPlanned || 0} planned
          </span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Partial Execution (Half)
          </span>
          <div className="text-2xl font-bold font-mono">
            {summary?.halfCount || 0}
          </div>
          <span className="text-xs text-muted-foreground">
            Tasks completed partially
          </span>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Primary Friction Source
          </span>
          <div className="text-sm font-bold font-mono truncate">
            {reasons?.categoryBreakdown?.[0]?.category || 'None recorded'}
          </div>
          <span className="text-xs text-muted-foreground">
            {reasons?.categoryBreakdown?.[0]?.count ? `${reasons.categoryBreakdown[0].count} times recorded` : 'Flawless execution'}
          </span>
        </Card>
      </div>

      {/* Guided Reflection Questions */}
      <div className="space-y-4">
        {/* Wins */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-foreground" />
              <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
                1. What Worked Well? (Wins & Highlights)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Celebrate high-focus blocks, consistent habits, and goals achieved this week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Maintained morning deep work routine on 4 out of 5 days. Shipped system architecture docs..."
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Challenges & Friction */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-foreground" />
              <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
                2. What Did Not Work? (Challenges & Bottlenecks)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Examine recurring reasons for missed tasks: distraction, schedule overload, fatigue, or low planning fidelity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Repeatedly overloaded Tuesday and Thursday with too many flexible learning blocks without buffer time..."
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Adjustments for Next Week */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-foreground" />
              <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
                3. Concrete Adjustments for Next Week
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Commit to specific schedule calibrations, buffer blocks, or routine modifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Schedule no more than 3 flexible tasks daily. Block 12:00 - 13:00 strictly for offline recharge..."
              value={nextWeekChanges}
              onChange={(e) => setNextWeekChanges(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

