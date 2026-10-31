"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { User, Bell, Clock, Shield, Download, Trash2, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { user, preferences, updatePreferences, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [timezone, setTimezone] = useState(preferences?.timezone || 'UTC');
  const [timeFormat, setTimeFormat] = useState(preferences?.timeFormat || '24h');
  const [weekStartsOn, setWeekStartsOn] = useState(preferences?.weekStartsOn ?? 1);
  const [wakeTime, setWakeTime] = useState(preferences?.wakeTimeLocal || '07:00');
  const [sleepTime, setSleepTime] = useState(preferences?.sleepTimeLocal || '23:00');

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(preferences?.quietHours?.enabled ?? false);
  const [quietStart, setQuietStart] = useState(preferences?.quietHours?.start || '22:00');
  const [quietEnd, setQuietEnd] = useState(preferences?.quietHours?.end || '07:00');

  const [taskStartNotif, setTaskStartNotif] = useState(preferences?.notificationPreferences?.taskStart ?? true);
  const [taskDeadlineNotif, setTaskDeadlineNotif] = useState(preferences?.notificationPreferences?.taskDeadline ?? true);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Re-auth states for export & delete
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) setFullName(user.fullName);
    if (preferences) {
      setTimezone(preferences.timezone);
      setTimeFormat(preferences.timeFormat);
      setWeekStartsOn(preferences.weekStartsOn);
      setWakeTime(preferences.wakeTimeLocal);
      setSleepTime(preferences.sleepTimeLocal);
      setQuietHoursEnabled(preferences.quietHours?.enabled ?? false);
      setQuietStart(preferences.quietHours?.start || '22:00');
      setQuietEnd(preferences.quietHours?.end || '07:00');
      setTaskStartNotif(preferences.notificationPreferences?.taskStart ?? true);
      setTaskDeadlineNotif(preferences.notificationPreferences?.taskDeadline ?? true);
    }
  }, [user, preferences]);

  const handleSavePreferences = async () => {
    try {
      if (fullName !== user?.fullName) {
        await api.updateMe({ fullName });
      }

      await updatePreferences({
        timezone,
        timeFormat: timeFormat as any,
        weekStartsOn,
        wakeTimeLocal: wakeTime,
        sleepTimeLocal: sleepTime,
        quietHours: {
          enabled: quietHoursEnabled,
          start: quietStart,
          end: quietEnd
        },
        notificationPreferences: {
          ...preferences?.notificationPreferences,
          taskStart: taskStartNotif,
          taskDeadline: taskDeadlineNotif,
          dailyPlanning: true,
          dailyReview: true,
          emailNotifications: false,
          pushNotifications: true
        }
      });
      toast.success('Preferences updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update preferences');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    }
  };

  const handleExportData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!exportPassword) {
      toast.error('Password confirmation is required to export personal data');
      return;
    }
    setIsExporting(true);
    try {
      const data = await api.exportUserData(exportPassword);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ordo-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
      setIsExportDialogOpen(false);
      setExportPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password confirmation is required to permanently delete your account');
      return;
    }
    setIsDeleting(true);
    try {
      await api.deleteAccount(deletePassword);
      toast.success('Account and all data deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletePassword('');
      logout();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight">Account & Preferences</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your schedule defaults, timezone, notifications, and security settings.
        </p>
      </div>

      {/* Profile & Schedule Defaults */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Profile & Schedule Defaults
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Full Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Email</label>
              <Input value={user?.email || ''} disabled className="opacity-70 font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Time Format</label>
              <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-Hour (14:00)</SelectItem>
                  <SelectItem value="12h">12-Hour (02:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Usual Wake Time</label>
              <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Usual Sleep Time</label>
              <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t border-border flex justify-end">
          <Button onClick={handleSavePreferences} size="sm">Save Profile & Defaults</Button>
        </CardFooter>
      </Card>

      {/* Quiet Hours & Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Notifications & Quiet Hours
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <p className="text-sm font-medium">Task Start Reminders</p>
              <p className="text-xs text-muted-foreground">Receive in-app alerts when a scheduled commitment starts.</p>
            </div>
            <Switch checked={taskStartNotif} onCheckedChange={setTaskStartNotif} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <p className="text-sm font-medium">Quiet Hours Protection</p>
              <p className="text-xs text-muted-foreground">Silence notifications during dedicated rest periods.</p>
            </div>
            <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-foreground/30">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Quiet Start</label>
                <Input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Quiet End</label>
                <Input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 border-t border-border flex justify-end">
          <Button onClick={handleSavePreferences} size="sm">Save Notifications</Button>
        </CardFooter>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Security & Credentials
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 12 chars, 1 uppercase, 1 lowercase, 1 number"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" variant="outline" disabled={!currentPassword || newPassword.length < 12}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data Management & Deletion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-foreground" />
            <CardTitle className="text-sm font-semibold uppercase font-mono tracking-wider">
              Data Management & Privacy
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Export all your routines, tasks, outcomes, and reflections in JSON format, or permanently remove your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Export Personal Data with re-authentication modal */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium">Export Personal Data</p>
              <p className="text-xs text-muted-foreground">Download full data snapshot including status history.</p>
            </div>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleExportData}>
                  <DialogHeader>
                    <DialogTitle>Confirm Password to Export Data</DialogTitle>
                    <DialogDescription>
                      To protect your privacy and ensure security, please re-enter your password to download your full personal data archive.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Password Confirmation
                    </label>
                    <Input
                      type="password"
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="text-xs"
                      autoFocus
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsExportDialogOpen(false);
                        setExportPassword('');
                      }}
                      disabled={isExporting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!exportPassword || isExporting}>
                      {isExporting ? 'Exporting...' : 'Verify & Export'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Delete Account with password re-authentication modal */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/40 bg-destructive/5">
            <div>
              <p className="text-sm font-medium text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently wipe all account data, tasks, outcomes, and routines.</p>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-4 w-4" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your ORDO account, all scheduled tasks, outcome history, and routine templates.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Confirm Password to Proceed
                  </label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="text-xs"
                    autoFocus
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setDeletePassword('');
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword || isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

