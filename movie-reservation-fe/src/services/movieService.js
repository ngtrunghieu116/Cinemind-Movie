import { movieApi } from '../api/movieApi';
import { movieMapper } from '../utils/movieMapper';
import { logger } from '../utils/logger';

/**
 * Service Layer cho Movie Module.
 * Chuẩn hoá response từ axiosClient (đã unwrap response.data) thành MovieViewModel.
 */
export const movieService = {
    /**
     * Lấy danh sách phim đang chiếu.
     * Backend contract: GET /api/movies/now-showing -> List<MovieResponse>
     * @returns {Promise<Array>} Danh sách MovieViewModel
     */
    getNowShowing: async () => {
        try {
            const response = await movieApi.getNowShowing();
            const list = Array.isArray(response) ? response : (response?.content || []);
            return movieMapper.toListViewModel(list);
        } catch (error) {
            logger.error('Failed to fetch now showing movies in movieService', error);
            throw error;
        }
    },

    /**
     * Lấy danh sách phim sắp chiếu.
     * Backend contract: GET /api/movies/coming-soon -> List<MovieResponse>
     * @returns {Promise<Array>} Danh sách MovieViewModel
     */
    getComingSoon: async () => {
        try {
            const response = await movieApi.getComingSoon();
            const list = Array.isArray(response) ? response : (response?.content || []);
            return movieMapper.toListViewModel(list);
        } catch (error) {
            logger.error('Failed to fetch coming soon movies in movieService', error);
            throw error;
        }
    },

    /**
     * Lấy chi tiết phim theo ID.
     * Backend contract: GET /api/movies/{id} -> MovieResponse
     * @param {string|number} id
     * @returns {Promise<Object>} MovieViewModel
     */
    getMovieById: async (id) => {
        try {
            const response = await movieApi.getMovieById(id);
            return movieMapper.toViewModel(response);
        } catch (error) {
            logger.error(`Failed to fetch movie detail ID=${id} in movieService`, error);
            throw error;
        }
    },

    /**
     * Lấy toàn bộ phim có filter.
     * Backend contract: GET /api/movies -> List<MovieResponse>
     * @param {Object} params
     * @returns {Promise<Array>} Danh sách MovieViewModel
     */
    getMovies: async (params) => {
        try {
            const response = await movieApi.getMovies(params);
            const list = Array.isArray(response) ? response : (response?.content || []);
            return movieMapper.toListViewModel(list);
        } catch (error) {
            logger.error('Failed to fetch movies in movieService', error);
            throw error;
        }
    }
};
