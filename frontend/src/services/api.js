import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

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
};

export const surveys = {
  create: (data) => api.post('/surveys', data),
  getAll: () => api.get('/surveys'),
  getById: (id) => api.get(`/surveys/${id}`),
  submit: (id, data) => api.post(`/surveys/${id}/submit`, data),
};

export default api; 