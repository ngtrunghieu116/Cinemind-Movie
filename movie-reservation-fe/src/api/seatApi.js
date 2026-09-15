import axiosClient from './axiosClient';

/**
 * API client cho Showtime Seats (Sơ đồ ghế và Giữ chỗ).
 */
export const seatApi = {
    /**
     * Lấy sơ đồ ghế công khai cho suất chiếu
     * @param {number|string} showtimeId
     */
    getShowtimeSeats: (showtimeId) => {
        return axiosClient.get(`/public/showtimes/${showtimeId}/seats`);
    },

    /**
     * Tạm giữ danh sách ghế
     * @param {Object} data
     * @param {number} data.showtimeId
     * @param {Array<number>} data.seatIds
     * @param {string} [data.holdToken]
     */
    holdSeats: (data) => {
        return axiosClient.post('/showtime-seats/hold', data);
    },

    /**
     * Giải phóng danh sách ghế đang giữ
     * @param {Object} data
     * @param {number} data.showtimeId
     * @param {Array<number>} data.seatIds
     * @param {string} data.holdToken
     */
    releaseSeats: (data) => {
        return axiosClient.post('/showtime-seats/release', data);
    }
};

export default seatApi;
