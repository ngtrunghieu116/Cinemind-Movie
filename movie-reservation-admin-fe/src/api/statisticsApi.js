import axiosClient from './axiosClient';

const BASE = '/admin/statistics';

/**
 * Format a LocalDate (Date object or ISO string) to yyyy-MM-dd
 */
const fmt = (d) => {
    if (!d) return undefined;
    if (typeof d === 'string') return d.substring(0, 10);
    return d.toISOString().substring(0, 10);
};

const statisticsApi = {
    /**
     * GET /api/admin/statistics/overview?date=yyyy-MM-dd
     * @param {Date|string} date
     */
    getOverview: (date) => {
        const params = {};
        if (date) params.date = fmt(date);
        return axiosClient.get(`${BASE}/overview`, { params });
    },

    /**
     * GET /api/admin/statistics/daily-revenue?from=...&to=...
     * @param {Date|string} from
     * @param {Date|string} to
     */
    getDailyRevenue: (from, to) => {
        const params = {};
        if (from) params.from = fmt(from);
        if (to)   params.to   = fmt(to);
        return axiosClient.get(`${BASE}/daily-revenue`, { params });
    },

    /**
     * GET /api/admin/statistics/movie-share?from=...&to=...
     */
    getMovieShare: (from, to) => {
        const params = {};
        if (from) params.from = fmt(from);
        if (to)   params.to   = fmt(to);
        return axiosClient.get(`${BASE}/movie-share`, { params });
    },

    /**
     * GET /api/admin/statistics/top-movies?from=...&to=...&limit=10
     */
    getTopMovies: (from, to, limit = 10) => {
        const params = { limit };
        if (from) params.from = fmt(from);
        if (to)   params.to   = fmt(to);
        return axiosClient.get(`${BASE}/top-movies`, { params });
    },

    /**
     * GET /api/admin/statistics/room-performance?from=...&to=...
     */
    getRoomPerformance: (from, to) => {
        const params = {};
        if (from) params.from = fmt(from);
        if (to)   params.to   = fmt(to);
        return axiosClient.get(`${BASE}/room-performance`, { params });
    },
};

export default statisticsApi;
