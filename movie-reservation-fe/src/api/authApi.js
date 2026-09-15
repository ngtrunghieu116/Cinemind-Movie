import axiosClient from './axiosClient';

export const authApi = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  googleLogin: (data) => axiosClient.post('/auth/google', data),
  logout: () => axiosClient.post('/auth/logout'),
  changePassword: (data) => axiosClient.put('/auth/password', data),
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
  getCurrentUser: () => axiosClient.get('/users/me'),
  updateProfile: (data) => axiosClient.put('/users/me', data),
  getTransactionHistory: () => axiosClient.get('/users/me/transactions'),
};
