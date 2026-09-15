import axiosClient from './axiosClient';

export const articleApi = {
    getPublicArticles: (params = { page: 0, size: 9 }) => {
        return axiosClient.get('/articles', { params });
    },
    getPublicArticleById: (id) => {
        return axiosClient.get(`/articles/${id}`);
    }
};

export default articleApi;
