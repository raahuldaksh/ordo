"use client";

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  LogOut,
  Settings,
  Menu
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { addDays, subDays, format, parseISO } from 'date-fns';
import Link from 'next/link';

export function Header() {
  const { selectedDate, setSelectedDate, setQuickAddOpen, toggleMobileNav } = useUIStore();
  const { user, logout } = useAuth();

  const handlePrevDay = () => {
    const current = parseISO(selectedDate);
    setSelectedDate(format(subDays(current, 1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const current = parseISO(selectedDate);
    setSelectedDate(format(addDays(current, 1), 'yyyy-MM-dd'));
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const parsedDate = parseISO(selectedDate);
  const fullFormattedDate = format(parsedDate, 'EEEE, MMMM d, yyyy');
  const compactFormattedDate = format(parsedDate, 'EEE, MMM d');

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Left side: Mobile Hamburger + Logo + Date Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileNav}
          className="h-9 w-9 md:hidden shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Compact Logo on Phone */}
        <Link href="/dashboard" className="md:hidden flex items-center shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background font-bold tracking-widest text-xs shadow-xs">
            O
          </div>
        </Link>

        {/* Date Navigation Buttons */}
        <div className="flex items-center rounded-lg border border-border p-0.5 bg-background shadow-xs shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            title="Previous Day"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant={isToday ? "secondary" : "ghost"}
            size="sm"
            onClick={handleToday}
            className="h-7 px-2 sm:h-8 sm:px-3 text-[11px] sm:text-xs font-medium"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
            title="Next Day"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Date Label: Full on md+, Compact on mobile */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-tight px-1 sm:px-2 min-w-0">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden lg:block shrink-0" />
          <span className="hidden sm:inline truncate">{fullFormattedDate}</span>
          <span className="sm:hidden text-xs truncate font-mono">{compactFormattedDate}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <Button
          onClick={() => setQuickAddOpen(true)}
          size="sm"
          className="h-8 px-2 sm:px-3 gap-1.5 font-medium shadow-xs active:scale-95 transition-transform"
          aria-label="New Task"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </Button>

        <NotificationCenter />
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 shrink-0 touch-manipulation">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-bold bg-foreground text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.fullName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
