'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signOut, getCurrentUser } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    },
  },
}, { ssr: false });

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User, refreshToken?: string) => void;
  logout: () => void;
  refreshSession: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString() || null;

      if (idToken && currentUser) {
        const payload = session.tokens?.idToken?.payload;
        setToken(idToken);
        setUser({
          name: (payload?.name as string) || '',
          email: (payload?.email as string) || currentUser.signInDetails?.loginId || '',
        });
      }
    } catch {
      // No authenticated user — that's fine
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = (_token: string, userData: User, _refreshToken?: string) => {
    // Amplify manages tokens internally, but we still expose them in state
    // for backward compatibility with api.ts calls
    setToken(_token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setToken(null);
    setUser(null);
    // Clean up any legacy localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  };

  const refreshSession = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const idToken = session.tokens?.idToken?.toString() || null;
      if (idToken) {
        setToken(idToken);
      }
      return idToken;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshSession, isAuthenticated: !!token }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
