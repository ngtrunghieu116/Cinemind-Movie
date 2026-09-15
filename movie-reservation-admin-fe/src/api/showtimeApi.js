import axiosClient from './axiosClient';

const showtimeApi = {
  createShowtime(data) {
    return axiosClient.post('/admin/showtimes', data);
  },

  updateShowtime(id, data) {
    return axiosClient.put(`/admin/showtimes/${id}`, data);
  },

  deleteShowtime(id) {
    return axiosClient.delete(`/admin/showtimes/${id}`);
  },

  getShowtimeById(id) {
    return axiosClient.get(`/admin/showtimes/${id}`);
  },

  searchShowtimes(params) {
    return axiosClient.get('/admin/showtimes', { params });
  }
};

export default showtimeApi;
