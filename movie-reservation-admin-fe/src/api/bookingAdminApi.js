import axiosClient from './axiosClient';

const bookingAdminApi = {
    /**
     * Lấy danh sách booking phân trang cho Admin với các bộ lọc
     * @param {Object} params - { search, bookingStatus, paymentStatus, showtimeDate, page, size, sort }
     */
    getBookings: (params) => {
        return axiosClient.get('/admin/bookings', { params });
    },

    /**
     * Lấy thông tin chi tiết một booking cho Admin
     * @param {number|string} reservationId
     */
    getBookingDetail: (reservationId) => {
        return axiosClient.get(`/admin/bookings/${reservationId}`);
    },

    /**
     * Thực hiện Check-in cho một mã vé
     * @param {string} ticketCode
     */
    checkInTicket: (ticketCode) => {
        return axiosClient.post(`/tickets/${ticketCode}/check-in`);
    },

    /**
     * Xác thực tính hợp lệ của vé trước khi check-in
     * @param {Object} payload - { ticketCode }
     */
    validateTicket: (payload) => {
        return axiosClient.post('/tickets/validate', payload);
    }
};

export default bookingAdminApi;
