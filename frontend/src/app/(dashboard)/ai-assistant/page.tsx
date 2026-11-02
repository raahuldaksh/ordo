"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ThumbsUp, ThumbsDown, Trash2, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AiAssistantPage() {
  const queryClient = useQueryClient();
  const [hasConsented, setHasConsented] = useState(true);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.listAiInsights()
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateAiInsights({ userConsent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      toast.success('AI execution analysis generated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to generate insights');
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: 'HELPFUL' | 'UNHELPFUL' }) =>
      api.sendAiFeedback(id, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      toast.success('Feedback recorded');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAiInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
      toast.success('Insight dismissed');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Productivity Assistant</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Advisory performance coaching and schedule overload diagnostics.
          </p>
        </div>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="gap-1.5 font-medium w-full sm:w-auto h-9 text-xs"
        >
          <Sparkles className="h-4 w-4" />
          {generateMutation.isPending ? 'Analyzing Metrics...' : 'Generate New Insight'}
        </Button>
      </div>

      {/* Advisory Principles Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20 text-xs">
        <ShieldCheck className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">AI Assistant Transparency</p>
          <p className="text-muted-foreground leading-relaxed">
            AI output is advisory, not guaranteed truth. Suggestions highlight supporting metrics and recurring friction patterns.
            ORDO will <strong>never</strong> auto-reschedule, auto-delete, or auto-complete your tasks without your explicit confirmation.
          </p>
        </div>
      </div>

      {/* Insights Stream */}
      {insights.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-semibold">No insights generated yet.</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click above to generate an analysis of your recent task completion rates and recurring obstacle patterns.
          </p>
          <Button size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="mt-2">
            Generate Weekly Reflection
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {insights.map((insight) => (
            <Card key={insight._id} className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">{insight.content.title}</CardTitle>
                    <CardDescription className="text-xs font-mono mt-0.5">
                      Analyzed period: {format(new Date(insight.periodStart), 'MMM d')} – {format(new Date(insight.periodEnd), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {insight.insightType.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-4">
                {/* Summary */}
                <p className="text-xs leading-relaxed font-medium">
                  {insight.content.summary}
                </p>

                {/* Observations */}
                {insight.content.observations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                      Observed Friction Patterns
                    </h4>
                    <ul className="space-y-1">
                      {insight.content.observations.map((obs, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0 mt-1.5" />
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {insight.content.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                      Actionable Recommendations
                    </h4>
                    <ul className="space-y-1.5">
                      {insight.content.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Routine Changes */}
                {insight.content.suggestedRoutineChanges && insight.content.suggestedRoutineChanges.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                      Suggested Routine Adjustments
                    </h4>
                    <div className="space-y-2">
                      {insight.content.suggestedRoutineChanges.map((change, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {change.action}
                              </Badge>
                              <span className="text-xs font-semibold">{change.title}</span>
                              {change.timeSlot && (
                                <span className="text-[10px] text-muted-foreground font-mono">({change.timeSlot})</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{change.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Was this insight helpful?</span>
                  <Button
                    variant={insight.feedback === 'HELPFUL' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ id: insight._id, feedback: 'HELPFUL' })}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <ThumbsUp className="h-3 w-3" /> Yes
                  </Button>
                  <Button
                    variant={insight.feedback === 'UNHELPFUL' ? 'destructive' : 'ghost'}
                    size="sm"
                    onClick={() => feedbackMutation.mutate({ id: insight._id, feedback: 'UNHELPFUL' })}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <ThumbsDown className="h-3 w-3" /> No
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(insight._id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Dismiss insight"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

