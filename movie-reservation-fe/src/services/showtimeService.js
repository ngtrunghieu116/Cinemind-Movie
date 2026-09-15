import { showtimeApi } from '../api/showtimeApi';
import { logger } from '../utils/logger';

/**
 * Service Layer cho Showtime Module.
 * Chuẩn hoá response từ axiosClient (đã unwrap response.data).
 * Backend contract: GET /api/showtimes -> Page<PublicShowtimeResponse> { content: [...], totalElements, ... }
 */
export const showtimeService = {
    /**
     * Lấy danh sách suất chiếu theo khoảng ngày.
     * @param {Object} params
     * @param {string} params.fromDate - ISO LocalDateTime format (e.g. 2026-08-21T00:00:00)
     * @param {string} params.toDate - ISO LocalDateTime format (e.g. 2026-08-21T23:59:59)
     * @param {number} [params.movieId]
     * @param {number} [params.theaterId]
     * @param {number} [params.page]
     * @param {number} [params.size]
     * @returns {Promise<Array>} Mảng các PublicShowtimeResponse thuần tuý
     */
    getShowtimes: async (params = {}) => {
        try {
            const response = await showtimeApi.getShowtimes(params);
            // Backend contract: Spring Page object chứa mảng showtimes trong property .content
            if (response && Array.isArray(response.content)) {
                return response.content;
            }
            if (Array.isArray(response)) {
                return response;
            }
            return [];
        } catch (error) {
            logger.error('Failed to fetch showtimes in showtimeService', error);
            throw error;
        }
    }
};
