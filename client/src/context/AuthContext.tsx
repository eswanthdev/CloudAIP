'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterData, AuthTokens } from '@/types';
import api from '@/lib/api';
import { setTokens, clearTokens, getAccessToken, getRefreshToken, setAccessToken } from '@/lib/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isClient: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isStudent: false,
  isClient: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }
        // Try refreshing
        const { data } = await api.post('/auth/refresh', { refreshToken });
        setAccessToken(data.data.accessToken);
      }
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post('/auth/login', credentials);
    const tokens: AuthTokens = data.data.tokens;
    setTokens(tokens);
    setUser(data.data.user);
    toast.success('Welcome back!');
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData);
    const tokens: AuthTokens = data.data.tokens;
    setTokens(tokens);
    setUser(data.data.user);
    toast.success('Account created successfully!');
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    toast.success('Logged out successfully');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    isClient: user?.role === 'client',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
