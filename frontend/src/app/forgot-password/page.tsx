"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [devTokenNotice, setDevTokenNotice] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email);
      toast.success(res.message);
      if (res.devResetToken) {
        setDevTokenNotice(res.devResetToken);
        setToken(res.devResetToken);
      }
      setStep('reset');
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      toast.error('Token and new password are required');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.resetPassword({ token, password: newPassword });
      toast.success(res.message);
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background font-bold tracking-widest text-lg shadow-md">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight">Account Recovery</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            Secure Password Reset
          </p>
        </div>

        <Card className="border-border shadow-sm">
          {step === 'request' ? (
            <form onSubmit={handleRequestReset}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Forgot your password?</CardTitle>
                <CardDescription className="text-xs">
                  Enter your verified email address to receive a single-use recovery token.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs font-semibold">
                  {isLoading ? 'Generating Link...' : 'Send Recovery Token'}
                </Button>
              </CardContent>
            </form>
          ) : (
            <form onSubmit={handleSetNewPassword}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Set New Password</CardTitle>
                <CardDescription className="text-xs">
                  Enter the recovery token and choose a strong new password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {devTokenNotice && (
                  <div className="p-2.5 rounded bg-muted text-[11px] font-mono break-all border border-border">
                    <span className="font-bold">Dev Recovery Token: </span>
                    {devTokenNotice}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recovery Token
                  </label>
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste 64-char token"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs font-semibold">
                  {isLoading ? 'Resetting Password...' : 'Save New Password'}
                </Button>
              </CardContent>
            </form>
          )}

          <CardFooter className="pt-0 pb-5 flex justify-center border-t border-border/40 mt-3">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 pt-3">
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

