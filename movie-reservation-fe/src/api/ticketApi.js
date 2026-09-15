import axiosClient from './axiosClient';

/**
 * API client cho Tickets (Vé điện tử & Mã QR).
 */
export const ticketApi = {
    /**
     * Lấy thông tin vé điện tử theo mã vé
     * @param {string} ticketCode
     */
    getTicket: (ticketCode) => {
        return axiosClient.get(`/tickets/${ticketCode}`);
    }
};

export default ticketApi;
