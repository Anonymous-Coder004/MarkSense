import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const attendanceService = {
  markAttendance: async (location: { lat: number; lng: number }) => {
    const response = await api.post('/attendance/mark', { location });
    return response.data;
  },

  punchOut: async (location: { lat: number; lng: number }) => {
    const response = await api.post('/attendance/punch-out', { location });
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },

  getAttendanceHistory: async (params: { period: string; page: number }) => {
    const response = await api.get('/attendance/history', { params });
    return response.data;
  },

  getAttendanceStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data;
  },
};