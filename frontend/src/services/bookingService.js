import apiClient from './api.js';

/**
 * Authentication Services
 */

export const authService = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  getProfile: () => apiClient.get('/auth/me'),
};

/**
 * Booking Services
 */

export const bookingService = {
  search: (data) => apiClient.post('/bookings/search', data),
  createBooking: (data) => apiClient.post('/bookings', data),
  getHistory: (limit = 10, offset = 0) =>
    apiClient.get('/bookings/history', { params: { limit, offset } }),
  getByPnr: (pnr) => apiClient.get(`/bookings/${pnr}`),
  cancelBooking: (bookingId) => apiClient.post(`/bookings/${bookingId}/cancel`),
};

/**
 * Admin Services
 */

export const adminService = {
  buses: {
    create: (data) => apiClient.post('/admin/buses', data),
    list: (limit = 20, offset = 0) =>
      apiClient.get('/admin/buses', { params: { limit, offset } }),
  },
  routes: {
    create: (data) => apiClient.post('/admin/routes', data),
    list: () => apiClient.get('/admin/routes'),
  },
  routeSchedules: {
    create: (data) => apiClient.post('/admin/route-schedules', data),
  },
  schedules: {
    create: (data) => apiClient.post('/admin/schedules', data),
    list: (filters = {}) =>
      apiClient.get('/admin/schedules', { params: filters }),
    get: (scheduleId) => apiClient.get(`/admin/schedules/${scheduleId}`),
  },
  bookings: {
    list: () => apiClient.get('/admin/bookings'),
  },
};
