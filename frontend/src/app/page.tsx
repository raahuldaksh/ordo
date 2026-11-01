"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Clock,
  PieChart,
  Repeat,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle,
  Shield,
  Layers,
  ArrowUpRight,
  Check,
  Zap,
  BarChart3,
  BookOpen,
  ChevronRight,
  SlidersHorizontal,
  Bell
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading, googleLogin, demoLogin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'plan' | 'track' | 'review'>('plan');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleExploreDemo = async () => {
    try {
      if (demoLogin) {
        await demoLogin();
      } else {
        await googleLogin({
          email: 'demo@ordo.app',
          fullName: 'ORDO Explorer',
          googleId: 'ordo_demo_explorer'
        });
      }
      router.push('/my-day');
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-foreground selection:text-background">
      {/* 1. Navigation Bar (Sticky with subtle blur) */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold tracking-widest text-sm shadow transition-transform group-hover:scale-95">
              O
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-none">ORDO</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-none tracking-widest uppercase mt-0.5">
                OS v1.0
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#preview" className="hover:text-foreground transition-colors">
              Product
            </a>
            <a href="#benefits" className="hover:text-foreground transition-colors">
              Benefits
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-medium h-8 px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs font-medium h-8 px-3.5 gap-1 shadow-xs">
                <span>Get Started</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Release Tag */}
        <div className="animate-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/40 text-xs font-mono text-muted-foreground mb-6">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Intentional 24-Hour Execution OS</span>
          <span className="text-border">|</span>
          <span className="text-foreground font-medium">v1.0 Live</span>
        </div>

        {/* Primary Headline */}
        <h1 className="animate-slide-up text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.08] text-foreground">
          Take control of your day.
        </h1>

        {/* Subheading */}
        <p className="animate-slide-up text-base sm:text-lg text-muted-foreground max-w-2xl mt-5 leading-relaxed">
          Standard to-do lists create unrealistic illusions. ORDO is a 24-hour timeline operating system designed to map realistic days, distinguish fixed commitments from flexible focus blocks, track root causes of friction, and systematically improve.
        </p>

        {/* Primary CTAs */}
        <div className="animate-slide-up flex flex-col sm:flex-row items-center gap-3 mt-8 w-full sm:w-auto">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="h-11 px-7 w-full sm:w-auto text-xs font-semibold gap-2 shadow-sm">
              <span>Start planning</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="h-11 px-7 w-full sm:w-auto text-xs font-semibold">
              Explore features
            </Button>
          </a>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleExploreDemo}
            className="h-11 px-5 w-full sm:w-auto text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Launch Instant Demo
          </Button>
        </div>

        {/* Micro Guarantee Strip */}
        <div className="flex items-center gap-6 mt-8 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-foreground" /> Zero fluff
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-foreground" /> Private & hardened
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-foreground" /> Strict monochrome SaaS
          </span>
        </div>
      </section>

      {/* 3. Product Preview (Faithful, Responsive Product Mockup Frame) */}
      <section id="preview" className="px-4 sm:px-6 max-w-6xl mx-auto w-full pb-20 md:pb-28">
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden animate-slide-up">
          {/* Mock Window Chrome */}
          <div className="h-10 border-b border-border bg-muted/40 px-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-border" />
              <div className="h-2.5 w-2.5 rounded-full bg-border" />
              <div className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-2 text-[11px] font-medium text-foreground">ordo.app/my-day</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Sync
              </span>
              <span>•</span>
              <span>24h Timeline Engine</span>
            </div>
          </div>

          {/* Interactive UI Mockup Interior */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6">
            {/* Mock Header inside app */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg">Daily Schedule & Execution</h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    Today
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  07:00 Wake • 23:00 Sleep • 8.5h Planned Focus
                </p>
              </div>

              {/* Mini Stats strip */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-muted-foreground text-[10px] uppercase">Completion</div>
                  <div className="font-bold text-foreground">83% (5/6)</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-right">
                  <div className="text-muted-foreground text-[10px] uppercase">Status</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> On Schedule
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Timeline Blocks */}
            <div className="space-y-3">
              {/* Task 1: Success */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-foreground/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm truncate">Morning Protocol & Day Architecture</span>
                      <Badge variant="outline" className="text-[9px] font-mono uppercase py-0 px-1.5 hidden sm:inline-block">
                        Routine
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                      <span>07:30 – 08:30</span>
                      <span>•</span>
                      <span>60 min</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-mono uppercase shrink-0">
                  Success
                </Badge>
              </div>

              {/* Task 2: Active Task (Muted blue focus border) */}
              <div className="p-3.5 rounded-xl border-2 border-blue-500/40 bg-blue-500/5 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 animate-spin text-blue-500" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm truncate">Deep Work: Zero-Trust Security Engine</span>
                      <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] font-mono uppercase py-0 px-1.5">
                        In Progress
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">10:00 – 12:30</span>
                      <span>•</span>
                      <span>150 min scheduled</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground block">Fixed Commitment</span>
                  <span className="text-[11px] font-mono font-medium text-blue-600 dark:text-blue-400">45m remaining</span>
                </div>
              </div>

              {/* Task 3: Half outcome with friction category */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-foreground/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm truncate">Technical Roadmap & Sync</span>
                      <Badge variant="outline" className="text-[9px] font-mono uppercase text-amber-600 dark:text-amber-400 border-amber-500/30">
                        Friction: Overestimation
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                      <span>13:30 – 14:30</span>
                      <span>•</span>
                      <span>Actual: 90m (exceeded)</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 border-amber-500/40 shrink-0">
                  Half Executed
                </Badge>
              </div>

              {/* Task 4: Pending future task */}
              <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-xs sm:text-sm truncate text-muted-foreground">
                      Evening Review & Tomorrow Protocol Setup
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                      <span>17:00 – 17:45</span>
                      <span>•</span>
                      <span>45 min</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono uppercase text-muted-foreground shrink-0">
                  Pending
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Benefits Section */}
      <section id="benefits" className="py-20 md:py-28 border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
              System Philosophy
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Designed for how days actually unfold.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most productivity apps fail because they treat an infinite wish list as a plan. ORDO forces temporal reality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="p-6 rounded-xl border border-border bg-card card-hover space-y-3">
              <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-sm">Plan your day</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Map every hour intentionally on an uninterrupted 24-hour canvas. Distinguish immovable fixed appointments from flexible focus blocks.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-6 rounded-xl border border-border bg-card card-hover space-y-3">
              <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-sm">Track what happened</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Record honest ternary outcomes: Success, Half, or Failed. A binary checkmark lies about reality when tasks take twice as long.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-6 rounded-xl border border-border bg-card card-hover space-y-3">
              <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-sm">Understand blockers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pinpoint real obstacles: Distraction, Fatigue, Overestimation, or External Interruptions. Keep private handwritten Actual Reasons.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="p-6 rounded-xl border border-border bg-card card-hover space-y-3">
              <div className="h-10 w-10 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-sm">Improve your routine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Turn empirical friction data into refined daily baselines. Conduct structured weekly reviews and apply AI advisory recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Comprehensive Feature Grid */}
      <section id="features" className="py-20 md:py-28 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
              Core Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Every tool necessary for disciplined execution.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No bloated social feeds or distraction gamification. Clean, functional tools built with precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. 24h Planner */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <Clock className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">24-Hour Continuous Timeline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Full 00:00 to 24:00 visualization. Identifies conflicting time slots, visualizes wake/sleep boundaries, and stores unscheduled overflow tasks.
                </p>
              </CardContent>
            </Card>

            {/* 2. Flexible vs Fixed Tasks */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <SlidersHorizontal className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Fixed vs. Flexible Tasks</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Distinguish strict external meetings from adaptable deep work. Reschedule flexible tasks without breaking anchor appointments.
                </p>
              </CardContent>
            </Card>

            {/* 3. Routine Templates */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <Repeat className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Routine Templates</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create daily and weekly schedules. Apply templates with smart conflict resolution strategies: Skip, Overwrite, or Shift around existing tasks.
                </p>
              </CardContent>
            </Card>

            {/* 4. Calendar Integration */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <Calendar className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Calendar Connection</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sync seamlessly with Google Calendar. Unify external commitments alongside internal deep work blocks on a single pane of glass.
                </p>
              </CardContent>
            </Card>

            {/* 5. Friction Analytics */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <BarChart3 className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Friction & Obstacle Analytics</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quantify why goals slip. Break down hours lost to Distraction, Fatigue, Overestimation, or External delays with historical trend graphs.
                </p>
              </CardContent>
            </Card>

            {/* 6. Smart Reminders & Quiet Hours */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <Bell className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Reminders & Quiet Hours</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive targeted alerts before scheduled commitments start. Notifications automatically silence during designated sleep and quiet hours.
                </p>
              </CardContent>
            </Card>

            {/* 7. Weekly Review */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <BookOpen className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Guided Weekly Reviews</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Structured 4-step retrospective to review total scheduled vs executed hours, celebrate wins, diagnose friction, and set next week's focus.
                </p>
              </CardContent>
            </Card>

            {/* 8. AI Advisory */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <Sparkles className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">AI Schedule Advisory</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Empirical pattern recognition. Recommends realistic buffer times, optimal focus slot durations, and pacing adjustments based on history.
                </p>
              </CardContent>
            </Card>

            {/* 9. Zero-Trust Security */}
            <Card className="card-hover">
              <CardContent className="p-6 space-y-3">
                <Shield className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-sm">Zero-Trust Hardened</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Built to bank-grade specs: SHA-256 hashed tokens at rest, tokenVersion session invalidation, double-submit CSRF, and strict IDOR isolation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. How It Works (3-Step Loop) */}
      <section id="how-it-works" className="py-20 md:py-28 border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
              The Execution Loop
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Three steps to operational clarity.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simple enough to repeat every single day without cognitive overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Step 01
              </div>
              <h3 className="font-bold text-base">Plan your 24 hours</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Before the day begins, position your anchor meetings and allocate realistic deep work windows. Apply routine templates to eliminate blank-slate friction.
              </p>
              <div className="pt-2 text-xs font-mono text-foreground font-semibold flex items-center gap-1">
                <span>Set fixed & flexible blocks</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Step 02
              </div>
              <h3 className="font-bold text-base">Execute and record</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Work through the timeline. When a block concludes, record ternary status (Success, Half, or Failed). Note friction categories and private actual reasons.
              </p>
              <div className="pt-2 text-xs font-mono text-foreground font-semibold flex items-center gap-1">
                <span>Log honest outcomes</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Step 03
              </div>
              <h3 className="font-bold text-base">Review and calibrate</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                At week's end, analyze completion rates and top friction causes. Adjust buffer times, calibrate routine templates, and enter the next week sharper.
              </p>
              <div className="pt-2 text-xs font-mono text-foreground font-semibold flex items-center gap-1">
                <span>Calibrate baseline schedule</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Closing Call to Action */}
      <section className="py-20 md:py-28 border-t border-border px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center rounded-2xl border border-border bg-card p-8 sm:p-12 space-y-6 shadow-sm">
          <Badge variant="outline" className="font-mono text-xs">
            Start Now • Zero Setup Fee
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Your life. In order.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Stop letting unstructured hours disappear. Take control of your day with the personal productivity operating system built for intentional execution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-11 px-8 w-full sm:w-auto text-xs font-semibold gap-2 shadow-sm">
                <span>Create Free Account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-11 px-8 w-full sm:w-auto text-xs font-semibold">
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-border bg-muted/10 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs">
              O
            </div>
            <span className="font-bold text-foreground tracking-tight">ORDO</span>
            <span className="font-mono text-[11px]">— Your Life. In Order.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <a href="#preview" className="hover:text-foreground transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>

          <div className="font-mono text-[11px] text-muted-foreground/70">
            © {new Date().getFullYear()} ORDO OS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
