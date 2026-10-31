"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, ShieldCheck, PieChart, Sparkles, Repeat, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading, googleLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleExploreDemo = async () => {
    try {
      await googleLogin({
        email: 'demo@ordo.app',
        fullName: 'ORDO Explorer',
        googleId: 'ordo_demo_explorer'
      });
      router.push('/dashboard');
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-foreground selection:text-background">
      {/* Navigation */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold tracking-widest text-sm shadow">
            O
          </div>
          <span className="font-bold text-base tracking-tight">ORDO</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-xs font-semibold shadow-xs">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto space-y-8">
        <Badge variant="outline" className="text-xs py-1 px-3 gap-1.5 font-mono">
          <Sparkles className="h-3.5 w-3.5" />
          Personal Operating System v1.0
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-[1.1]">
          Your Life. <br />
          <span className="italic font-serif font-light text-muted-foreground">In Order.</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          ORDO is not a standard to-do list. It is an intentional 24-hour timeline execution system designed to help you plan realistic days, distinguish fixed commitments from flexible focus blocks, record honest outcome reasons, and systematically improve.
        </p>

        {/* Core Loop Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-3 rounded-xl border border-border bg-card/60 shadow-xs font-mono text-xs text-foreground font-semibold">
          <span>Plan</span>
          <span className="text-muted-foreground">→</span>
          <span>Execute</span>
          <span className="text-muted-foreground">→</span>
          <span>Track</span>
          <span className="text-muted-foreground">→</span>
          <span>Understand</span>
          <span className="text-muted-foreground">→</span>
          <span>Improve</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/register">
            <Button size="lg" className="h-11 px-8 gap-2 font-semibold text-sm shadow-sm">
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={handleExploreDemo}
            className="h-11 px-8 text-sm font-semibold"
          >
            Launch Instant Demo
          </Button>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-16 text-left w-full">
          <div className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
            <Clock className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-sm">24-Hour Timeline Planner</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visualize your day from 00:00 to 24:00 with hour slots, overlap warnings, and an unscheduled queue.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
            <PieChart className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-sm">Root Cause Friction Analysis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Record outcomes (Success, Half, Failed) alongside obstacle categories and private handwritten Actual Reasons.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
            <Repeat className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-sm">Routines & Weekly Reviews</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build daily & weekly templates with smart conflict resolution, and conduct structured weekly reflections.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-border px-6 flex items-center justify-between text-xs text-muted-foreground max-w-7xl mx-auto w-full font-mono">
        <span>ORDO SaaS Platform</span>
        <span>Strict Monochrome Architecture</span>
      </footer>
    </div>
  );
}

