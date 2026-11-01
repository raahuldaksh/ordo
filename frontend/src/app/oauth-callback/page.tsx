"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        if (isMounted) {
          setError('Google authentication was cancelled or failed.');
          setTimeout(() => router.push(`/login?error=${encodeURIComponent(errorParam)}`), 1500);
        }
        return;
      }

      if (!token) {
        if (isMounted) {
          setError('No authentication token received.');
          setTimeout(() => router.push('/login?error=missing_token'), 1500);
        }
        return;
      }

      try {
        api.setAuthToken(token);
        await refreshUser();
        if (isMounted) {
          // Direct to /my-day for optimal UX
          router.push('/my-day');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to authenticate session.');
          setTimeout(() => router.push('/login?error=session_error'), 1500);
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, refreshUser, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center space-y-4 text-center max-w-sm">
        <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xl shadow-md">
          O
        </div>
        {error ? (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-destructive">Authentication Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-2 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Authenticating with Google...</h2>
            <p className="text-xs text-muted-foreground">Setting up your secure ORDO workspace</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

