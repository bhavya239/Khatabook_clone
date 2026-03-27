'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthState } from '@/lib/types';
import { authAPI } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  signup: (name: string, phone: string, password: string, pin?: string) => Promise<void>;
  logout: () => void;
  unlock: (pin: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isUnlocked: false,
  });
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('kb_token');
    const userStr = localStorage.getItem('kb_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({ user, token, isAuthenticated: true, isUnlocked: false });

        // Background sync to ensure latest user data (e.g. business role)
        authAPI.getMe().then(({ data }) => {
          localStorage.setItem('kb_user', JSON.stringify(data.user));
          setState(prev => ({ ...prev, user: data.user }));
        }).catch(() => {});

      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const { data } = await authAPI.login({ phone, password });
    localStorage.setItem('kb_token', data.token);
    localStorage.setItem('kb_user', JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isAuthenticated: true, isUnlocked: false });
  };

  const signup = async (name: string, phone: string, password: string, pin?: string) => {
    const { data } = await authAPI.signup({ name, phone, password, pin });
    localStorage.setItem('kb_token', data.token);
    localStorage.setItem('kb_user', JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isAuthenticated: true, isUnlocked: true });
  };

  const logout = useCallback(() => {
    localStorage.removeItem('kb_token');
    localStorage.removeItem('kb_user');
    setState({ user: null, token: null, isAuthenticated: false, isUnlocked: false });
  }, []);

  // PIN verification for hidden-mode unlock
  const unlock = async (pin: string): Promise<boolean> => {
    try {
      await authAPI.verifyPin(pin);
      setState((prev) => ({ ...prev, isUnlocked: true }));
      return true;
    } catch {
      return false;
    }
  };

  // Refresh user data (e.g. after creating a business)
  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      localStorage.setItem('kb_user', JSON.stringify(data.user));
      setState((prev) => ({ ...prev, user: data.user }));
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, unlock, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
