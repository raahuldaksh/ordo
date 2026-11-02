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

    async function handleAuth() {
      // Helper to extract param from searchParams, window.location.search, and window.location.hash
      const getParam = (name: string): string | null => {
        let val = searchParams.get(name);
        if (val) return val;

        if (typeof window !== 'undefined') {
          try {
            const sp = new URLSearchParams(window.location.search);
            val = sp.get(name);
            if (val) return val;

            if (window.location.hash) {
              const hp = new URLSearchParams(window.location.hash.replace(/^#\/?/, '?'));
              val = hp.get(name);
              if (val) return val;
            }

            const match = window.location.href.match(new RegExp(`[?&#]${name}=([^&#]*)`));
            if (match && match[1]) {
              return decodeURIComponent(match[1]);
            }
          } catch {}
        }
        return null;
      };

      let token = getParam('token');
      let refreshToken = getParam('refreshToken');
      let errorParam = getParam('error');

      // Hydration delay recovery: if token not yet present on mobile, wait 350ms and retry
      if (!token && !errorParam && typeof window !== 'undefined') {
        await new Promise((r) => setTimeout(r, 350));
        token = getParam('token');
        refreshToken = getParam('refreshToken');
        errorParam = getParam('error');
      }

      // Stored token fallback
      if (!token && typeof window !== 'undefined') {
        token = api.getAuthToken();
      }
      if (!refreshToken && typeof window !== 'undefined') {
        try {
          refreshToken = localStorage.getItem('ordo_refresh_token');
        } catch {}
      }

      hasProcessedRef.current = true;

      if (errorParam) {
        setError('Google authentication was cancelled or failed.');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.replace(`/login?error=${encodeURIComponent(errorParam!)}`);
          } else {
            router.replace(`/login?error=${encodeURIComponent(errorParam!)}`);
          }
        }, 2000);
        return;
      }

      if (!token) {
        setError('No authentication token received.');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.replace('/login?error=missing_token');
          } else {
            router.replace('/login?error=missing_token');
          }
        }, 2000);
        return;
      }

      try {
        // Persist tokens synchronously
        api.setAuthToken(token);
        if (refreshToken && typeof window !== 'undefined') {
          try {
            localStorage.setItem('ordo_refresh_token', refreshToken);
          } catch {}
        }

        // Verify user session with backend
        const user = await refreshUser();

        if (user) {
          // Hard navigation to /my-day to ensure complete auth state initialization on mobile
          if (typeof window !== 'undefined') {
            window.location.replace('/my-day');
          } else {
            router.replace('/my-day');
          }
        } else {
          throw new Error('User session could not be established.');
        }
      } catch (err: any) {
        console.error('OAuth callback session resolution error:', err);
        setError(err.message || 'Failed to authenticate session.');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.replace('/login?error=session_error');
          } else {
            router.replace('/login?error=session_error');
          }
        }, 2500);
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
