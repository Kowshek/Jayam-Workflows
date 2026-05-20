import axios from 'axios';
import type {
  User,
  Request,
  RequestLog,
  PaginatedRequests,
  Stats,
  RequestFilters,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 globally ──────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Let the auth store handle the redirect
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  getMe: () => api.get<{ user: User }>('/auth/me'),
};

// ─── Requests ────────────────────────────────────────────────────────────────
export const requestsApi = {
  create: (data: { title: string; description: string; category: string; priority: string }) =>
    api.post<{ request: Request }>('/requests', data),

  getMyRequests: (filters?: RequestFilters) =>
    api.get<PaginatedRequests>('/requests/mine', { params: filters }),

  getAll: (filters?: RequestFilters) =>
    api.get<PaginatedRequests>('/requests', { params: filters }),

  getById: (id: number) =>
    api.get<{ request: Request }>(`/requests/${id}`),

  updateStatus: (id: number, status: string, comment?: string) =>
    api.patch<{ request: Request }>(`/requests/${id}/status`, { status, comment }),

  getLogs: (id: number) =>
    api.get<{ logs: RequestLog[] }>(`/requests/${id}/logs`),

  getStats: () =>
    api.get<{ stats: Stats }>('/requests/stats'),
};
