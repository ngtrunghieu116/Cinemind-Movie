import axiosClient from './axiosClient';

const authApi = {
    login: (data) => {
        return axiosClient.post('/auth/login', data);
    },
};

export default authApi;
