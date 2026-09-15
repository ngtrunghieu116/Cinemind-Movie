import axiosClient from './axiosClient';

const roomApi = {
    getAll: (params) => {
        return axiosClient.get('/admin/rooms', { params });
    },
    getById: (id) => {
        return axiosClient.get(`/admin/rooms/${id}`);
    },
    create: (data) => {
        return axiosClient.post('/admin/rooms', data);
    },
    update: (id, data) => {
        return axiosClient.put(`/admin/rooms/${id}`, data);
    },
    delete: (id) => {
        return axiosClient.delete(`/admin/rooms/${id}`);
    },
};

export default roomApi;
