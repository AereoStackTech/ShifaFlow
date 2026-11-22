'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '@/src/lib/firebase';
import type { Lang } from '@/src/lib/i18n';

export type ClientUserRole = 'CLINIC_OWNER' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

export interface ClientUser {
  id: number;
  uid: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  phone: string | null;
  role: ClientUserRole;
  clinicId: number | null;
  isDemo: boolean;
}

export interface ClinicInfo {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  phone: string;
  currency: string;
  defaultDurationMin: number;
  workStart: string;
  workEnd: string;
  workingDays: string;
  onboardingCompleted: boolean;
}

export interface SubscriptionInfo {
  id: number;
  planTier: 'SOLO_CLINIC' | 'MULTI_DOCTOR' | 'HOSPITAL_ENTERPRISE';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  status: string;
  priceAmount: number;
  currency: string;
  renewDate: string;
}

interface AppContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: ClientUser | null;
  token: string | null;
  clinic: ClinicInfo | null;
  subscription: SubscriptionInfo | null;
  authLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<ClientUser>;
  registerWithEmail: (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role: ClientUserRole;
  }) => Promise<ClientUser>;
  loginWithGoogle: (preferredRole?: ClientUserRole) => Promise<ClientUser>;
  loginAsDemoRole: (role: ClientUserRole) => Promise<ClientUser>;
  logout: () => Promise<void>;
  refreshMe: (overrideToken?: string) => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<ClientUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Sync HTML dir, lang, and dark class
  useEffect(() => {
    const html = document.documentElement;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
  }, [lang]);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  const refreshMe = useCallback(
    async (overrideToken?: string) => {
      const activeToken = overrideToken ?? token;
      if (!activeToken) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setClinic(data.clinic ?? null);
          setSubscription(data.subscription ?? null);
        }
      } catch (err) {
        console.error('Failed to refresh session:', err);
      }
    },
    [token]
  );

  // Listen to Firebase Auth state (only syncs if user is signed in with Google)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          const res = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({}),
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            await refreshMe(idToken);
          }
        } catch (err) {
          console.error('Firebase state sync failed:', err);
        }
      }
    });
    return () => unsub();
  }, [refreshMe]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<ClientUser> => {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Sign-in failed');
        }
        setToken(data.token);
        setUser(data.user);
        await refreshMe(data.token);
        return data.user as ClientUser;
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshMe]
  );

  const registerWithEmail = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      role: ClientUserRole;
    }): Promise<ClientUser> => {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        setToken(data.token);
        setUser(data.user);
        await refreshMe(data.token);
        return data.user as ClientUser;
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshMe]
  );

  const loginWithGoogle = useCallback(
    async (preferredRole?: ClientUserRole): Promise<ClientUser> => {
      setAuthLoading(true);
      try {
        const cred = await signInWithPopup(auth, googleAuthProvider);
        const idToken = await cred.user.getIdToken();
        const res = await fetch('/api/auth/firebase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ preferredRole }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Google sign-in verification failed');
        }
        setToken(idToken);
        setUser(data.user);
        await refreshMe(idToken);
        return data.user as ClientUser;
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshMe]
  );

  const loginAsDemoRole = useCallback(
    async (role: ClientUserRole): Promise<ClientUser> => {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Demo sign-in failed');
        }
        setToken(data.token);
        setUser(data.user);
        await refreshMe(data.token);
        return data.user as ClientUser;
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshMe]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore if not firebase session
    }
    setToken(null);
    setUser(null);
    setClinic(null);
    setSubscription(null);
  }, []);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...init, headers });
    },
    [token]
  );

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        theme,
        toggleTheme,
        user,
        token,
        clinic,
        subscription,
        authLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemoRole,
        logout,
        refreshMe,
        authFetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
