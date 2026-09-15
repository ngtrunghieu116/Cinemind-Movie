import axiosClient from './axiosClient';

const articleApi = {
    getAll: (params) => {
        return axiosClient.get('/admin/articles', { params });
    },
    getById: (id) => {
        return axiosClient.get(`/admin/articles/${id}`);
    },
    create: (formData) => {
        return axiosClient.post('/admin/articles', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    update: (id, formData) => {
        return axiosClient.put(`/admin/articles/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    publish: (id) => {
        return axiosClient.patch(`/admin/articles/${id}/publish`);
    },
    hide: (id) => {
        return axiosClient.patch(`/admin/articles/${id}/hide`);
    },
    delete: (id) => {
        return axiosClient.delete(`/admin/articles/${id}`);
    },
};

export default articleApi;
