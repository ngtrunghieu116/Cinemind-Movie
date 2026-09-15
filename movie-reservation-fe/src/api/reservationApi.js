import axiosClient from './axiosClient';

/**
 * API client cho Reservation (Đơn đặt vé và Combo F&B).
 */
export const reservationApi = {
    /**
     * Khởi tạo đơn đặt vé từ ghế đang giữ
     * @param {Object} data
     * @param {number} data.showtimeId
     * @param {Array<number>} data.seatIds
     * @param {string} data.holdToken
     */
    createReservation: (data) => {
        return axiosClient.post('/reservations', data);
    },

    /**
     * Thêm sản phẩm F&B / Combo vào đơn đặt vé
     * @param {number|string} reservationId
     * @param {Object} data
     * @param {number} data.productId
     * @param {number} data.quantity
     */
    addCombo: (reservationId, data) => {
        return axiosClient.post(`/reservations/${reservationId}/items`, data);
    },

    /**
     * Cập nhật số lượng sản phẩm F&B trong đơn đặt vé
     * @param {number|string} reservationId
     * @param {number|string} itemId
     * @param {Object} data
     * @param {number} data.quantity
     */
    updateCombo: (reservationId, itemId, data) => {
        return axiosClient.put(`/reservations/${reservationId}/items/${itemId}`, data);
    },

    /**
     * Xóa sản phẩm F&B khỏi đơn đặt vé
     * @param {number|string} reservationId
     * @param {number|string} itemId
     */
    removeCombo: (reservationId, itemId) => {
        return axiosClient.delete(`/reservations/${reservationId}/items/${itemId}`);
    },

    /**
     * Xem lại chi tiết đơn đặt vé
     * @param {number|string} reservationId
     */
    reviewReservation: (reservationId) => {
        return axiosClient.get(`/reservations/${reservationId}/review`);
    },

    /**
     * Lấy lịch sử đặt vé của người dùng hiện tại
     */
    getBookingHistory: () => {
        return axiosClient.get('/reservations/history');
    },

    /**
     * Lấy lịch sử đặt vé chi tiết của người dùng hiện tại (cho User FE)
     */
    getMyBookingHistory: () => {
        return axiosClient.get('/reservations/my-history');
    }
};

export default reservationApi;
