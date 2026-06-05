import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aeronexis_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aeronexis_token');
      localStorage.removeItem('aeronexis_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ── Dashboard ─────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ── Orders ────────────────────────────────
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// ── Manufacturing ─────────────────────────
export const manufacturingAPI = {
  getAll: () => api.get('/manufacturing'),
  getOne: (id: string) => api.get(`/manufacturing/${id}`),
  getStats: () => api.get('/manufacturing/stats'),
  getTraceability: (batchNumber: string) =>
    api.get(`/manufacturing/traceability/${batchNumber}`),
  create: (data: any) => api.post('/manufacturing', data),
  update: (id: string, data: any) => api.put(`/manufacturing/${id}`, data),
};

// ── Materials ─────────────────────────────
export const materialsAPI = {
  getAll: () => api.get('/materials'),
  getOne: (id: string) => api.get(`/materials/${id}`),
  getStats: () => api.get('/materials/stats'),
  getAlerts: () => api.get('/materials/alerts'),
  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  reserve: (id: string, data: any) => api.post(`/materials/${id}/reserve`, data),
};

// ── Incidents ─────────────────────────────
export const incidentsAPI = {
  getAll: () => api.get('/incidents'),
  getOne: (id: string) => api.get(`/incidents/${id}`),
  getStats: () => api.get('/incidents/stats'),
  create: (data: any) => api.post('/incidents', data),
  update: (id: string, data: any) => api.put(`/incidents/${id}`, data),
};

// ── Customers ─────────────────────────────
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getOne: (id: string) => api.get(`/customers/${id}`),
  getStats: () => api.get('/customers/stats'),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// ── Products ──────────────────────────────
export const productsAPI = {
  getAll: () => api.get('/products'),
  getOne: (id: string) => api.get(`/products/${id}`),
  getStats: () => api.get('/products/stats'),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ── Users ─────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  getOne: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ── AI ─────────────────────────────────────
export const aiAPI = {
  delays: () => api.get('/ai/delays'),
  stock: () => api.get('/ai/stock'),
  quality: () => api.get('/ai/quality'),
  fullReport: () => api.get('/ai/report'),
};
// ── Shipments ─────────────────────────────
export const shipmentsAPI = {
  getAll: () => api.get('/shipments'),
  getOne: (id: string) => api.get(`/shipments/${id}`),
  getStats: () => api.get('/shipments/stats'),
  create: (data: any) => api.post('/shipments', data),
  update: (id: string, data: any) => api.put(`/shipments/${id}`, data),
};

// ── Notifications ─────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ── Audit ─────────────────────────────────
export const auditAPI = {
  getAll: () => api.get('/audit'),
  getMy: () => api.get('/audit/my'),
};