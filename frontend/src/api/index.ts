import axios from 'axios';
import { io } from 'socket.io-client';
import { notifyGlobalLoadEnd, notifyGlobalLoadStart } from '../context/GlobalLoaderContext';

const APP_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const API_BASE = import.meta.env.VITE_API_BASE || `${APP_BASE}/api`;
export const SOCKET_BASE = API_BASE.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const shouldTrackLoader = (config?: any) => !config?.skipGlobalLoader;

api.interceptors.request.use((config) => {
  if (shouldTrackLoader(config)) {
    notifyGlobalLoadStart();
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (shouldTrackLoader(res.config)) {
      notifyGlobalLoadEnd();
    }
    return res;
  },
  async (err) => {
    if (shouldTrackLoader(err.config)) {
      notifyGlobalLoadEnd();
    }
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh });
          localStorage.setItem('access_token', data.access);
          err.config.headers.Authorization = `Bearer ${data.access}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = `${APP_BASE}/login`;
        }
      } else {
        localStorage.clear();
        window.location.href = `${APP_BASE}/login`;
      }
    }
    return Promise.reject(err);
  },
);

export default api;

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
};

export const overviewApi = {
  getPage: (path: string, params?: any) => api.get('/overview/page', { params: { path, ...(params || {}) } }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const patientsApi = {
  list: (params?: any) => api.get('/patients', { params }),
  get: (id: number) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: number, data: any) => api.patch(`/patients/${id}`, data),
  delete: (id: number) => api.delete(`/patients/${id}`),
  searchForPicker: async (search: string) => {
    const res = await api.get('/patients', { params: { search, page_size: 8 } });
    return res.data.results || res.data || [];
  },
};

export const allergiesApi = {
  list: (params?: any) => api.get('/allergies', { params }),
  create: (data: any) => api.post('/allergies', data),
  update: (id: number, data: any) => api.patch(`/allergies/${id}`, data),
  delete: (id: number) => api.delete(`/allergies/${id}`),
};

export const vitalsApi = {
  list: (params?: any) => api.get('/vitals', { params }),
  create: (data: any) => api.post('/vitals', data),
  update: (id: number, data: any) => api.patch(`/vitals/${id}`, data),
  delete: (id: number) => api.delete(`/vitals/${id}`),
};

export const lifestyleApi = {
  list: (params?: any) => api.get('/lifestyle', { params }),
  get: (patientId: number) => api.get('/lifestyle', { params: { patient_id: patientId } }).then(r => ({ ...r, data: Array.isArray(r.data) ? r.data[0] || null : r.data })),
  upsert: (data: any) => api.post('/lifestyle', data),
  delete: (id: number) => api.delete(`/lifestyle/${id}`),
};

export const medicalHistoryApi = {
  list: (params?: any) => api.get('/medical-history', { params }),
  get: (patientId: number) => api.get('/medical-history', { params: { patient_id: patientId } }).then(r => ({ ...r, data: Array.isArray(r.data) ? r.data[0] || null : r.data })),
  upsert: (data: any) => api.post('/medical-history', data),
  delete: (id: number) => api.delete(`/medical-history/${id}`),
};

export const medicationsApi = {
  list: (params?: any) => api.get('/medications', { params }),
  create: (data: any) => api.post('/medications', data),
  update: (id: number, data: any) => api.patch(`/medications/${id}`, data),
  delete: (id: number) => api.delete(`/medications/${id}`),
};

export const conditionsApi = {
  list: (params?: any) => api.get('/chronic-conditions', { params }),
  create: (data: any) => api.post('/chronic-conditions', data),
  update: (id: number, data: any) => api.patch(`/chronic-conditions/${id}`, data),
  delete: (id: number) => api.delete(`/chronic-conditions/${id}`),
};

export const oncologyApi = {
  records: {
    list: (params?: any) => api.get('/oncology-records', { params }),
    get: (id: number) => api.get(`/oncology-records/${id}`),
    create: (data: any) => api.post('/oncology-records', data),
    update: (id: number, data: any) => api.patch(`/oncology-records/${id}`, data),
    delete: (id: number) => api.delete(`/oncology-records/${id}`),
  },
  treatments: {
    list: (params?: any) => api.get('/oncology-treatments', { params }),
    create: (data: any) => api.post('/oncology-treatments', data),
    update: (id: number, data: any) => api.patch(`/oncology-treatments/${id}`, data),
    delete: (id: number) => api.delete(`/oncology-treatments/${id}`),
    reschedule: (id: number, data: any) => api.post(`/oncology-treatments/${id}/reschedule`, data),
    complete: (id: number, data?: any) => api.post(`/oncology-treatments/${id}/complete`, data || {}),
    delay: (id: number, data?: any) => api.post(`/oncology-treatments/${id}/delay`, data || {}),
    readiness: (id: number, data: any) => api.post(`/oncology-treatments/${id}/readiness`, data),
  },
  followups: {
    list: (params?: any) => api.get('/oncology-followups', { params }),
    create: (data: any) => api.post('/oncology-followups', data),
    update: (id: number, data: any) => api.patch(`/oncology-followups/${id}`, data),
    delete: (id: number) => api.delete(`/oncology-followups/${id}`),
  },
  symptoms: {
    list: (params?: any) => api.get('/oncology-symptoms', { params }),
    create: (data: any) => api.post('/oncology-symptoms', data),
    update: (id: number, data: any) => api.patch(`/oncology-symptoms/${id}`, data),
    delete: (id: number) => api.delete(`/oncology-symptoms/${id}`),
    setState: (id: number, data: any) => api.post(`/oncology-symptoms/${id}/state`, data),
  },
  payer: {
    list: (params?: any) => api.get('/payer-submissions', { params }),
    create: (data: any) => api.post('/payer-submissions', data),
    update: (id: number, data: any) => api.patch(`/payer-submissions/${id}`, data),
    delete: (id: number) => api.delete(`/payer-submissions/${id}`),
    setStatus: (id: number, data: any) => api.post(`/payer-submissions/${id}/status`, data),
  },
};

export const adminUsersApi = {
  list: (params?: any) => api.get('/admin/users', { params }),
  get: (id: number) => api.get(`/admin/users/${id}`),
  create: (data: any) => api.post('/admin/users', data),
  update: (id: number, data: any) => api.patch(`/admin/users/${id}`, data),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
};

export const auditApi = {
  list: (params?: any) => api.get('/audit-logs', { params }),
};

export const exportsApi = {
  queueAnalytics: (data: any) => api.post('/exports/analytics', data),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  test: (data?: any) => api.post('/notifications/test', data || {}),
};

export const createNotificationSocket = (username: string) => io(SOCKET_BASE, {
  auth: { username },
  transports: ['websocket', 'polling'],
});
