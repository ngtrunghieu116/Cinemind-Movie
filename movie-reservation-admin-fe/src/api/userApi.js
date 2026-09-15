import axiosClient from './axiosClient';

const userApi = {
  getUsers: (params) => {
    return axiosClient.get('/admin/users', { params });
  },

  getUserById: (id) => {
    return axiosClient.get(`/admin/users/${id}`);
  },

  updateUser: (id, data) => {
    return axiosClient.put(`/admin/users/${id}`, data);
  },

  resetPassword: (id, newPassword) => {
    return axiosClient.put(`/admin/users/${id}/reset-password`, { newPassword });
  },

  deleteUser: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  }
};

export default userApi;
