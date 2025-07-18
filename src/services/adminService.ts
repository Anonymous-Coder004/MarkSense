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

export const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getEmployees: async (params?: any) => {
    const response = await api.get('/admin/employees', { params });
    return response.data;
  },

  updateEmployeeStatus: async (employeeId: string, status: string) => {
    const response = await api.patch(`/admin/employees/${employeeId}`, { status });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings: any) => {
    const response = await api.patch('/admin/settings', settings);
    return response.data;
  },

  generateReport: async (params: any) => {
    const response = await api.get('/admin/reports', { params , responseType: 'blob'});
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/admin/departments',);
    return response.data
  },
};