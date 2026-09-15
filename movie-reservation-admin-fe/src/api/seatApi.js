import axiosClient from './axiosClient';

const seatApi = {
    getByRoomId: (roomId) => {
        return axiosClient.get(`/seats/room/${roomId}`);
    },

    generateLayout: (roomId, data) => {
        return axiosClient.post(`/seats/room/${roomId}/generate`, data);
    },

    updateSeat: (seatId, data) => {
        return axiosClient.put(`/seats/${seatId}`, data);
    },

    batchUpdateSeats: (data) => {
        return axiosClient.patch('/seats/batch-update', data);
    }
};

export default seatApi;
