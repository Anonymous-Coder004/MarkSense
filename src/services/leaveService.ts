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

export const leaveService = {
  submitLeaveRequest: async (leaveData: any) => {
    const response = await api.post('/leaves', leaveData);
    return response.data;
  },

  getLeaveRequests: async (params?: any) => {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  approveLeave: async (leaveId: string) => {
    const response = await api.patch(`/leaves/${leaveId}/approve`);
    return response.data;
  },

  rejectLeave: async (leaveId: string) => {
    const response = await api.patch(`/leaves/${leaveId}/reject`);
    return response.data;
  },
};