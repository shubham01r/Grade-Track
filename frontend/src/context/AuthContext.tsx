import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
};

export const DEMO_TOKEN = 'demo-bypass-token-2026';
export const DEMO_USER: User = {
  id: 'demo-admin',
  name: 'Demo Admin',
  email: 'admin@gradetrack.local',
  role: 'ADMIN',
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  enterDemoMode: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('gradetrack_token') ?? localStorage.getItem('gradetrack_token') ?? localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('gradetrack_user') ?? localStorage.getItem('gradetrack_user') ?? localStorage.getItem('user');
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('gradetrack_token', token);
      localStorage.setItem('gradetrack_token', token);
      localStorage.setItem('token', token);
      return;
    }

    sessionStorage.removeItem('gradetrack_token');
    localStorage.removeItem('gradetrack_token');
    localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('gradetrack_user', JSON.stringify(user));
      localStorage.setItem('gradetrack_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      return;
    }

    sessionStorage.removeItem('gradetrack_user');
    localStorage.removeItem('gradetrack_user');
    localStorage.removeItem('user');
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

  const enterDemoMode = () => {
    setToken(DEMO_TOKEN);
    setUser(DEMO_USER);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, loading, login, enterDemoMode, logout }),
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
