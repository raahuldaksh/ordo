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
      const data = await api.getMe();
      setUser(data.user);
      setPreferences(data.preferences);
    } catch {
      setUser(null);
      setPreferences(null);
      localStorage.removeItem('ordo_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    if (res.tokens?.accessToken) {
      localStorage.setItem('ordo_token', res.tokens.accessToken);
    }
    await refreshUser();
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    if (res.tokens?.accessToken) {
      localStorage.setItem('ordo_token', res.tokens.accessToken);
    }
    await refreshUser();
    router.push('/onboarding');
  };

  const googleLogin = async (data: any) => {
    const res = await api.googleLogin(data);
    if (res.tokens?.accessToken) {
      localStorage.setItem('ordo_token', res.tokens.accessToken);
    }
    await refreshUser();
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('ordo_token');
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

