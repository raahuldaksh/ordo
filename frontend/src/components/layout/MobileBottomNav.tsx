"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  CalendarDays,
  Menu,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleMobileNav, setQuickAddOpen } = useUIStore();

  const isDashboard = pathname === '/dashboard';
  const isMyDay = pathname.startsWith('/my-day');
  const isTasks = pathname.startsWith('/tasks');
  const isCalendar = pathname.startsWith('/calendar');

  return (
    <>
      {/* Floating Action Button for Quick Task Creation */}
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        className="fixed right-4 bottom-20 z-40 md:hidden h-12 w-12 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center active:scale-90 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Create Task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 h-16 md:hidden border-t border-border bg-card/95 backdrop-blur-lg flex items-center justify-around px-2 select-none safe-area-bottom">
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors",
            isDashboard
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard className={cn("h-5 w-5 mb-0.5", isDashboard && "stroke-[2.5]")} />
          <span>Dashboard</span>
        </Link>

        {/* 2. My Day */}
        <Link
          href="/my-day"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors",
            isMyDay
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className={cn("h-5 w-5 mb-0.5", isMyDay && "stroke-[2.5]")} />
          <span>My Day</span>
        </Link>

        {/* 3. Tasks */}
        <Link
          href="/tasks"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors",
            isTasks
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckSquare className={cn("h-5 w-5 mb-0.5", isTasks && "stroke-[2.5]")} />
          <span>Tasks</span>
        </Link>

        {/* 4. Calendar */}
        <Link
          href="/calendar"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors",
            isCalendar
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className={cn("h-5 w-5 mb-0.5", isCalendar && "stroke-[2.5]")} />
          <span>Calendar</span>
        </Link>

        {/* 5. More (triggers full slide-over drawer) */}
        <button
          type="button"
          onClick={toggleMobileNav}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

