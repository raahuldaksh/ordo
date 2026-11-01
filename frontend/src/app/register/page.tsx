"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getBackendUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Mail, User, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasLength = password.length >= 8 && password.length <= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length > 8) {
      toast.error('Password cannot exceed 8 characters');
      return;
    }
    if (confirmPassword.length > 8) {
      toast.error('Confirm password cannot exceed 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isPasswordValid) {
      toast.error('Password does not meet security requirements');
      return;
    }
    if (!agreed) {
      toast.error('Please accept the Terms of Service to continue');
      return;
    }

    setIsLoading(true);
    try {
      await register({ fullName, email, password });
      toast.success('Account created. Welcome to ORDO!');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const backendUrl = getBackendUrl();
    window.location.assign(`${backendUrl}/api/v1/auth/google`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background font-bold tracking-widest text-lg shadow-md">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight">Create your ORDO Account</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            Plan • Execute • Track • Understand • Improve
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {/* Google signup button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full text-xs font-medium h-9 gap-2 shadow-xs cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono">
                  <span className="bg-card px-2 text-muted-foreground">or email</span>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 text-xs"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    maxLength={8}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 8 && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> Password cannot exceed 8 characters
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    maxLength={8}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 8 && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" /> Confirm password cannot exceed 8 characters
                  </p>
                )}
              </div>

              {/* Password Security Criteria */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-[11px] font-mono">
                <div className={`flex items-center gap-1.5 ${hasLength ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  <Check className="h-3 w-3" /> Minimum 8 characters (max 8)
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  <Check className="h-3 w-3" /> Uppercase and lowercase letters
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  <Check className="h-3 w-3" /> At least one number
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  I accept the Terms of Service and Privacy Policy. I understand my routine data remains private.
                </label>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs font-semibold mt-2">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="pt-0 pb-6 flex justify-center border-t border-border/40 mt-4">
            <p className="text-xs text-muted-foreground pt-4">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-foreground hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

