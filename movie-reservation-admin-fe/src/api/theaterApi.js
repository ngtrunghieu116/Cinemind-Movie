import axiosClient from './axiosClient';

const theaterApi = {
    getAll: (params) => {
        return axiosClient.get('/admin/theaters', { params });
    },
    getById: (id) => {
        return axiosClient.get(`/admin/theaters/${id}`);
    },
    create: (data) => {
        return axiosClient.post('/admin/theaters', data);
    },
    update: (id, data) => {
        return axiosClient.put(`/admin/theaters/${id}`, data);
    },
    delete: (id) => {
        return axiosClient.delete(`/admin/theaters/${id}`);
    },
};

export default theaterApi;
