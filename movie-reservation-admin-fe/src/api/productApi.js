import axiosClient from './axiosClient';

const productApi = {
    getAll: (params) => {
        return axiosClient.get('/admin/products', { params });
    },

    getById: (id) => {
        return axiosClient.get(`/admin/products/${id}`);
    },

    create: (formData) => {
        return axiosClient.post('/admin/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    update: (id, formData) => {
        return axiosClient.put(`/admin/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    delete: (id) => {
        return axiosClient.delete(`/admin/products/${id}`);
    },
};

export default productApi;
