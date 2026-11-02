"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    async function handleAuth() {
      // 1. Multi-tier resolution for token and error parameters
      let token = searchParams.get('token');
      let refreshToken = searchParams.get('refreshToken');
      let errorParam = searchParams.get('error');

      if (typeof window !== 'undefined') {
        const windowParams = new URLSearchParams(window.location.search);
        if (!token) token = windowParams.get('token');
        if (!refreshToken) refreshToken = windowParams.get('refreshToken');
        if (!errorParam) errorParam = windowParams.get('error');

        // Fallback to pre-existing stored token if URL params were cleared
        if (!token) {
          token = api.getAuthToken();
        }
        if (!refreshToken) {
          try { refreshToken = localStorage.getItem('ordo_refresh_token'); } catch {}
        }
      }

      if (errorParam) {
        setError('Google authentication was cancelled or failed.');
        setTimeout(() => router.replace(`/login?error=${encodeURIComponent(errorParam!)}`), 1500);
        return;
      }

      if (!token) {
        setError('No authentication token received.');
        setTimeout(() => router.replace('/login?error=missing_token'), 1500);
        return;
      }

      try {
        // 2. Persist tokens synchronously
        api.setAuthToken(token);
        if (refreshToken && typeof window !== 'undefined') {
          try { localStorage.setItem('ordo_refresh_token', refreshToken); } catch {}
        }

        // 3. Verify user session with backend
        const user = await refreshUser();

        if (user) {
          // 4. Safely clean up URL query parameters
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          // 5. Navigate to protected planner route without retaining callback in history
          router.replace('/my-day');
        } else {
          throw new Error('User session could not be established.');
        }
      } catch (err: any) {
        console.error('OAuth callback session resolution error:', err);
        setError(err.message || 'Failed to authenticate session.');
        setTimeout(() => router.replace('/login?error=session_error'), 1500);
      }
    }

    handleAuth();
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

