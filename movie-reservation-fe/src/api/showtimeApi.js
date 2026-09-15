import axiosClient from './axiosClient';

/**
 * API client cho Public Showtimes.
 */
export const showtimeApi = {
    /**
     * Search showtimes by filters
     * @param {Object} params
     * @param {number} [params.movieId]
     * @param {number} [params.theaterId]
     * @param {number} [params.roomId]
     * @param {string} [params.fromDate] ISO format
     * @param {string} [params.toDate] ISO format
     * @param {number} [params.page]
     * @param {number} [params.size]
     */
    getShowtimes: (params = {}) => {
        return axiosClient.get('/showtimes', { params });
    },

    /**
     * Lấy danh sách ngày có suất chiếu khả dụng (toàn rạp hoặc theo 1 phim).
     * @param {number} [movieId]
     * @returns {Promise<string[]>} Mảng các ngày ISO (YYYY-MM-DD)
     */
    getAvailableDates: (movieId) => {
        const params = movieId ? { movieId } : {};
        return axiosClient.get('/showtimes/available-dates', { params });
    }
};
