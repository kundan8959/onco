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
  /** The currently active patient record (scoped to selected hospital). */
  patient: any | null;
  /** All patient records across every hospital this patient is registered at. */
  patientRecords: any[];
  /** Switch the active hospital context by patient row id. */
  setActivePatientById: (id: number) => void;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  patient: null,
  patientRecords: [],
  setActivePatientById: () => {},
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const ACTIVE_PATIENT_KEY = 'oncocare-active-patient-id';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveActive = useCallback((records: any[]) => {
    if (records.length === 0) return null;
    const savedId = Number(localStorage.getItem(ACTIVE_PATIENT_KEY));
    const saved = savedId ? records.find((r) => r.id === savedId) : null;
    return saved || records[0];
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);

      // patient_records is the full list; fall back gracefully if backend is older.
      const records: any[] = data.patient_records || (data.patient ? [data.patient] : []);
      setPatientRecords(records);

      const active = resolveActive(records);
      setActivePatient(active);

      // Keep localStorage in sync for token refresh interceptor reference
      localStorage.setItem('user', JSON.stringify(data.user));
      if (active) {
        localStorage.setItem('patient', JSON.stringify(active));
      } else {
        localStorage.removeItem('patient');
      }
    } catch {
      // Token is invalid or expired — clear everything
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('patient');
      localStorage.removeItem(ACTIVE_PATIENT_KEY);
      setUser(null);
      setPatientRecords([]);
      setActivePatient(null);
    }
  }, [resolveActive]);

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
    localStorage.removeItem(ACTIVE_PATIENT_KEY);
    setUser(null);
    setPatientRecords([]);
    setActivePatient(null);
  };

  const setActivePatientById = useCallback((id: number) => {
    const record = patientRecords.find((r) => r.id === id);
    if (!record) return;
    setActivePatient(record);
    localStorage.setItem(ACTIVE_PATIENT_KEY, String(id));
    localStorage.setItem('patient', JSON.stringify(record));
  }, [patientRecords]);

  const refreshProfile = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{
      user,
      patient: activePatient,
      patientRecords,
      setActivePatientById,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
