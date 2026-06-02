/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Sync state initialization directly during useState to avoid mount-time cascading renders
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('feelm_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          return { id: payload.id, email: payload.email };
        } else {
          localStorage.removeItem('feelm_token');
        }
      } catch {
        localStorage.removeItem('feelm_token');
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('feelm_token', data.token);
      setUser(data.user);
      setAuthModalOpen(false);
      return data.user;
    } catch (error) {
      console.error('Login error in Context:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.register(email, password);
      localStorage.setItem('feelm_token', data.token);
      setUser(data.user);
      setAuthModalOpen(false);
      return data.user;
    } catch (error) {
      console.error('Registration error in Context:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('feelm_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    authModalOpen,
    setAuthModalOpen,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
