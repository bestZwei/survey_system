import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // 生产环境使用相对路径
  : 'http://localhost:3000/api';  // 开发环境使用完整URL

const api = axios.create({
  baseURL: API_URL,
});

// 请求拦截器添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      return response;
    } catch (error) {
      console.error('注册请求失败:', error.response?.data || error.message);
      throw error;
    }
  },
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateCurrentUser: (data) => api.put('/auth/me', data),
};

export const surveys = {
  create: (data) => api.post('/surveys', data),
  getAll: () => api.get('/surveys'),
  getById: (id) => api.get(`/surveys/${id}`),
  getMySurveys: () => api.get('/surveys/my-surveys'),
  getMyResponses: () => api.get('/surveys/my-responses'),
  getSurveyResponse: (id) => api.get(`/surveys/${id}/my-response`),
  submit: (id, data) => api.post(`/surveys/${id}/submit`, data),
  updateResponse: (id, data) => api.put(`/surveys/${id}/response`, data),
  deleteResponse: (id) => api.delete(`/surveys/${id}/response`),
  deleteSurvey: (id) => api.delete(`/surveys/${id}`),
  getSurveyStats: (id) => api.get(`/surveys/${id}/stats`),
};

export const admin = {
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getSystemStats: () => api.get('/admin/stats'),
  updateUserInfo: (userId, data) => api.put(`/admin/users/${userId}/info`, data)
};

export default api; 