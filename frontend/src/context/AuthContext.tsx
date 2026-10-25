import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartcart_token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.getMe();
      setUser(res.data);
    } catch {
      // If token invalid, attempt auto-login demo account
      tryAutoLoginDemo();
    } finally {
      setLoading(false);
    }
  };

  const tryAutoLoginDemo = async () => {
    try {
      const res = await apiClient.login({ email: 'demo@smartcart.ai', password: 'SmartCart123!' });
      const newToken = res.data.access_token;
      localStorage.setItem('smartcart_token', newToken);
      setToken(newToken);
      setUser(res.data.user);
    } catch (err) {
      console.warn('Auto-login demo account unavailable yet:', err);
      localStorage.removeItem('smartcart_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      tryAutoLoginDemo();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.login({ email, password });
      const newToken = res.data.access_token;
      localStorage.setItem('smartcart_token', newToken);
      setToken(newToken);
      setUser(res.data.user);
      return true;
    } catch (err) {
      console.error('Login error', err);
      return false;
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      const res = await apiClient.register(data);
      const newToken = res.data.access_token;
      localStorage.setItem('smartcart_token', newToken);
      setToken(newToken);
      setUser(res.data.user);
      return true;
    } catch (err) {
      console.error('Registration error', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('smartcart_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await apiClient.getMe();
      setUser(res.data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
