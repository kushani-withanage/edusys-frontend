import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../utils/api';
import type { AuthRequest, AuthResponse } from '../utils/api';

interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: AuthRequest) => Promise<AuthResponse>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage for saved session
    const storedToken = localStorage.getItem('edusys_token');
    const storedUser = localStorage.getItem('edusys_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        localStorage.removeItem('edusys_token');
        localStorage.removeItem('edusys_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: AuthRequest): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await api.login(credentials);

      // Save to localStorage
      localStorage.setItem('edusys_token', response.token);
      localStorage.setItem('edusys_user', JSON.stringify({
        userId: response.userId,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
      }));

      // Update state
      setToken(response.token);
      setUser({
        userId: response.userId,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
      });

      return response;
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('edusys_token');
    localStorage.removeItem('edusys_user');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    isAuthenticated: !!token,
    user,
    token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

