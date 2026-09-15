import axiosClient from './axiosClient';

const reviewApi = {
    getAll: (params) => {
        return axiosClient.get('/admin/reviews', { params });
    },
    publish: (id) => {
        return axiosClient.patch(`/admin/reviews/${id}/publish`);
    },
    hide: (id) => {
        return axiosClient.patch(`/admin/reviews/${id}/hide`);
    },
    delete: (id) => {
        return axiosClient.delete(`/admin/reviews/${id}`);
    },
};

export default reviewApi;
