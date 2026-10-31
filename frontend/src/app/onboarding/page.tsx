"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowRight, Check, Clock, Calendar, Sparkles, Moon, Sun, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function OnboardingPage() {
  const router = useRouter();
  const { preferences, updatePreferences } = useAuth();
  const { setTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [weekStartsOn, setWeekStartsOn] = useState(1);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [createStarterRoutine, setCreateStarterRoutine] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // 1. Save preferences
      await updatePreferences({
        timezone,
        theme: selectedTheme as any,
        timeFormat: timeFormat as any,
        weekStartsOn,
        wakeTimeLocal: wakeTime,
        sleepTimeLocal: sleepTime
      });

      // 2. If starter routine chosen, create standard daily routine template
      if (createStarterRoutine) {
        const routine = await api.createRoutine({
          name: 'Core Daily Rhythm',
          templateType: 'DAILY',
          description: 'Balanced baseline routine with sleep, deep work, and reviews.'
        });

        // Add default fixed and flexible items
        await api.addRoutineItem(routine._id, {
          title: 'Morning Routine & Breakfast',
          taskType: 'FIXED',
          priority: 'HIGH',
          startTimeLocal: '07:30',
          endTimeLocal: '08:30',
          durationMinutes: 60
        });

        await api.addRoutineItem(routine._id, {
          title: 'Deep Work Focus Block 1',
          taskType: 'FLEXIBLE',
          priority: 'HIGH',
          startTimeLocal: '09:00',
          endTimeLocal: '11:30',
          durationMinutes: 150
        });

        await api.addRoutineItem(routine._id, {
          title: 'Daily Shutdown & Review',
          taskType: 'FIXED',
          priority: 'MEDIUM',
          startTimeLocal: '21:30',
          endTimeLocal: '22:00',
          durationMinutes: 30
        });
      }

      toast.success('Onboarding complete. Welcome to your personal operating system.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Error saving onboarding settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[520px] space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>STEP {step} OF 3</span>
          <button
            onClick={() => router.push('/dashboard')}
            className="hover:text-foreground hover:underline"
          >
            Skip for now
          </button>
        </div>

        {/* Step 1: Welcome & Core Philosophy */}
        {step === 1 && (
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background font-bold tracking-widest text-xl shadow">
                O
              </div>
              <CardTitle className="text-xl font-bold tracking-tight pt-2">
                Welcome to ORDO
              </CardTitle>
              <CardDescription className="text-xs uppercase font-mono tracking-wider">
                Your Life. In Order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <p>
                ORDO is not a casual to-do list. It is an intentional execution operating system structured around a five-phase daily loop:
              </p>

              <div className="p-3 rounded-lg border border-border bg-muted/20 font-mono text-[11px] text-center text-foreground font-semibold">
                Plan → Execute → Track → Understand → Improve
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-semibold text-foreground">Task Classifications:</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 rounded border border-border/60 bg-card">
                    <span className="font-semibold text-foreground font-mono">FIXED: </span>
                    Inflexible commitments that must happen at an exact time (classes, sleep, meals).
                  </div>
                  <div className="p-2.5 rounded border border-border/60 bg-card">
                    <span className="font-semibold text-foreground font-mono">FLEXIBLE: </span>
                    Deep focus blocks that can shift or compress (DSA, coding, study).
                  </div>
                  <div className="p-2.5 rounded border border-border/60 bg-card">
                    <span className="font-semibold text-foreground font-mono">UNPLANNED: </span>
                    Interference or surprise events added mid-day to trace schedule drift.
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button onClick={() => setStep(2)} className="w-full h-9 text-xs gap-1.5 font-semibold">
                <span>Configure Preferences</span> <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Timezone, Theme & Hours */}
        {step === 2 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Time & Environment</CardTitle>
              <CardDescription className="text-xs">
                Set up your local timezone, visual theme, and sleep cycle boundaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Detected Timezone</label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="text-xs font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Theme</label>
                  <Select
                    value={selectedTheme}
                    onValueChange={(t) => {
                      setSelectedTheme(t);
                      setTheme(t);
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="light">Monochrome Light</SelectItem>
                      <SelectItem value="dark">Monochrome Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Time Format</label>
                  <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as any)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24-Hour (15:00)</SelectItem>
                      <SelectItem value="12h">12-Hour (03:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Usual Wake Time</label>
                  <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Usual Sleep Time</label>
                  <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="text-xs" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>Back</Button>
              <Button size="sm" onClick={() => setStep(3)} className="gap-1.5 font-semibold">
                <span>Next: Routine Setup</span> <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Starter Routine & Launch */}
        {step === 3 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Routine Initiation</CardTitle>
              <CardDescription className="text-xs">
                Choose how you'd like to begin organizing your 24-hour day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => setCreateStarterRoutine(true)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  createStarterRoutine
                    ? 'border-foreground bg-foreground/5 shadow-xs font-semibold'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">Start with Core Daily Rhythm</span>
                  <Badge variant={createStarterRoutine ? 'default' : 'outline'} className="text-[10px]">
                    Recommended
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                  Includes morning routine (07:30 - 08:30), flexible deep work focus block (09:00 - 11:30), and daily shutdown review (21:30 - 22:00).
                </p>
              </div>

              <div
                onClick={() => setCreateStarterRoutine(false)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  !createStarterRoutine
                    ? 'border-foreground bg-foreground/5 shadow-xs font-semibold'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">Start with a Blank Schedule</span>
                </div>
                <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                  Start from zero and manually construct tasks or customized templates at your own pace.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>Back</Button>
              <Button size="sm" onClick={handleFinish} disabled={isLoading} className="gap-1.5 font-semibold">
                {isLoading ? 'Setting up...' : 'Launch Dashboard'} <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

