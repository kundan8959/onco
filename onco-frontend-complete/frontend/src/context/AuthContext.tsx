import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'superadmin' | 'hospital' | 'patient';
  hospital_name?: string | null;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  patient: any | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  patient: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      setPatient(data.patient || null);
      // Keep localStorage in sync for token refresh interceptor reference
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.patient) {
        localStorage.setItem('patient', JSON.stringify(data.patient));
      } else {
        localStorage.removeItem('patient');
      }
    } catch {
      // Token is invalid or expired — clear everything
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('patient');
      setUser(null);
      setPatient(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    // Immediately fetch the full profile from /me
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('patient');
    setUser(null);
    setPatient(null);
  };

  const refreshProfile = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, patient, loading, isAuthenticated: !!user, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
