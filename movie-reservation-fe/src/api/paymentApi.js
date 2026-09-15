import axiosClient from './axiosClient';

/**
 * API client cho Payments (Thanh toán VNPAY).
 */
export const paymentApi = {
    /**
     * Khởi tạo giao dịch thanh toán VNPAY cho đơn đặt vé
     * @param {number|string} reservationId
     */
    createPayment: (reservationId) => {
        return axiosClient.post(`/payments/${reservationId}/create`);
    },

    /**
     * Gửi tham số callback return từ VNPAY để kiểm tra trạng thái hiển thị UI
     * @param {Object} params
     */
    getVnPayReturn: (params) => {
        return axiosClient.get('/payments/vnpay/return', { params });
    },

    /**
     * Lấy chi tiết trạng thái thanh toán và thông tin vé theo orderId
     * @param {string} orderId
     */
    getPaymentStatus: (orderId) => {
        return axiosClient.get('/payments/status', { params: { orderId } });
    }
};

export default paymentApi;
