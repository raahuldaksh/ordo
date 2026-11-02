"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserPreferences } from '@/types/api';
import { api, getBackendUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (data: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      // Check if token is present in URL query parameters (e.g. from OAuth redirect)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const urlRefreshToken = params.get('refreshToken');
        if (urlToken) {
          api.setAuthToken(urlToken);
        }
        if (urlRefreshToken) {
          try { localStorage.setItem('ordo_refresh_token', urlRefreshToken); } catch {}
        }
        if (urlToken) {
          // Only clean URL query params if we are NOT on /oauth-callback (let oauth-callback orchestrate its own lifecycle)
          if (!window.location.pathname.includes('/oauth-callback')) {
            params.delete('token');
            params.delete('refreshToken');
            params.delete('refresh');
            const cleanQuery = params.toString() ? `?${params.toString()}` : '';
            window.history.replaceState({}, document.title, `${window.location.pathname}${cleanQuery}`);
          }
        }
      }

      // Check if token exists in API client or localStorage before requesting
      const currentToken = api.getAuthToken();
      if (!currentToken) {
        setUser(null);
        setPreferences(null);
        return null;
      }

      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        setPreferences(data.preferences || null);
        return data.user;
      } else {
        setUser(null);
        setPreferences(null);
        return null;
      }
    } catch (err) {
      console.error('Failed to refresh user session:', err);
      setUser(null);
      setPreferences(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ambient pre-warm ping to ensure backend stays active with sub-second responsiveness
    if (typeof window !== 'undefined') {
      try {
        const backendUrl = getBackendUrl();
        if (backendUrl.includes('render.com')) {
          fetch(`${backendUrl}/health`, { mode: 'no-cors' }).catch(() => {});
        }
      } catch {}
      // Skip auto-refresh on oauth-callback — that page manages its own auth lifecycle
      if (window.location.pathname.includes('/oauth-callback')) return;
    }
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: any) => {
    await api.login(credentials);
    await refreshUser();
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    await api.register(data);
    await refreshUser();
    router.push('/onboarding');
  };

  const googleLogin = async (data: any) => {
    await api.googleLogin(data);
    await refreshUser();
    router.push('/dashboard');
  };

  const demoLogin = async () => {
    try {
      await api.demoLogin();
    } catch {
      await api.googleLogin({
        email: 'demo@ordo.app',
        fullName: 'ORDO Explorer',
        googleId: 'ordo_demo_explorer'
      });
    }
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    api.setAuthToken(null);
    setUser(null);
    setPreferences(null);
    router.push('/login');
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const updated = await api.updatePreferences(updates);
    setPreferences(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        demoLogin,
        logout,
        updatePreferences,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
