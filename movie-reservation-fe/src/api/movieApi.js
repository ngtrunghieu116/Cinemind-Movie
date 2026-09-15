import axiosClient from './axiosClient';

/**
 * Mảng API thuần tuý cho Movies.
 * Thiết kế sẵn phân trang (page, size) để backend dễ dàng chuyển đổi sau này.
 */
export const movieApi = {
    /**
     * @param {Object} params 
     * @param {number} params.page 
     * @param {number} params.size 
     */
    getNowShowing: (params = { page: 0, size: 8 }) => {
        return axiosClient.get('/movies/now-showing', { params });
    },

    /**
     * @param {Object} params 
     * @param {number} params.page 
     * @param {number} params.size 
     */
    getComingSoon: (params = { page: 0, size: 8 }) => {
        return axiosClient.get('/movies/coming-soon', { params });
    },

    /**
     * @param {string|number} id 
     */
    getMovieById: (id) => {
        return axiosClient.get(`/movies/${id}`);
    },

    /**
     * @param {Object} params 
     * @param {string} params.status 
     * @param {string} params.search 
     * @param {number} params.page 
     * @param {number} params.size 
     */
    getMovies: (params) => {
        return axiosClient.get('/movies', { params });
    }
};
