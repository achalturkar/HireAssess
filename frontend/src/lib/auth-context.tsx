'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signOut: () => void;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'hireassess-access-token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadSession = useCallback(async (token: string) => {
    const me = await apiFetch<AuthUser>('/auth/me', { accessToken: token });
    setUser(me);
    setAccessToken(token);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    loadSession(stored)
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [loadSession]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const result = await apiFetch<{ accessToken: string }>('/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });
      window.localStorage.setItem(STORAGE_KEY, result.accessToken);
      await loadSession(result.accessToken);
      router.push('/dashboard');
    },
    [loadSession, router],
  );

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
    router.push('/login');
  }, [router]);

  const hasPermission = useCallback(
    (module: string, action: string) => {
      if (!user) return false;
      if (user.isSuperAdmin) return true;
      return user.permissions.includes(`${module}:${action}`);
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, signIn, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
