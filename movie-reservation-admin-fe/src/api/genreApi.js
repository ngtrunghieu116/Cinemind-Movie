import axiosClient from './axiosClient';

const genreApi = {
    getAll: () => {
        return axiosClient.get('/genres');
    },
    create: (data) => {
        return axiosClient.post('/admin/genres', data);
    },
    update: (id, data) => {
        return axiosClient.put(`/admin/genres/${id}`, data);
    },
    delete: (id) => {
        return axiosClient.delete(`/admin/genres/${id}`);
    }
};

export default genreApi;
