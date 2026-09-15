import axiosClient from './axiosClient';

const movieApi = {
    getAll: (params) => {
        return axiosClient.get('/admin/movies', { params });
    },
    getById: (id) => {
        return axiosClient.get(`/admin/movies/${id}`);
    },
    create: (formData) => {
        return axiosClient.post('/admin/movies', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    update: (id, formData) => {
        return axiosClient.put(`/admin/movies/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => {
        return axiosClient.delete(`/admin/movies/${id}`);
    },
};

export default movieApi;
