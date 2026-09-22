import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';

type User = {
  id: string;
  email: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('gradetrack_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('gradetrack_user');
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('gradetrack_token', token);
      return;
    }

    sessionStorage.removeItem('gradetrack_token');
  }, [token]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('gradetrack_user', JSON.stringify(user));
      return;
    }

    sessionStorage.removeItem('gradetrack_user');
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setToken(response.data.token);
      setUser(response.data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, loading, login, logout }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
