import axiosClient from './axiosClient';

export const reviewApi = {
    getMovieReviews: (movieId, params = { page: 0, size: 10 }) => {
        return axiosClient.get(`/movies/${movieId}/reviews`, { params });
    },
    getMovieRatingSummary: (movieId) => {
        return axiosClient.get(`/movies/${movieId}/rating`);
    },
    submitReview: (data) => {
        return axiosClient.post('/reviews', data);
    },
    getMyReview: (movieId) => {
        return axiosClient.get(`/reviews/my-review/${movieId}`);
    }
};

export default reviewApi;
