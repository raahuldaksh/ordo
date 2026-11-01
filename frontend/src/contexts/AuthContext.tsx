"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserPreferences } from '@/types/api';
import { api } from '@/lib/api';
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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      // Check if token is present in URL query parameters (e.g. from OAuth redirect)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        if (urlToken) {
          api.setAuthToken(urlToken);
          params.delete('token');
          params.delete('refreshToken');
          params.delete('refresh');
          const cleanQuery = params.toString() ? `?${params.toString()}` : '';
          window.history.replaceState({}, document.title, `${window.location.pathname}${cleanQuery}`);
        }
      }

      const data = await api.getMe();
      setUser(data.user);
      setPreferences(data.preferences);
    } catch {
      setUser(null);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

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
