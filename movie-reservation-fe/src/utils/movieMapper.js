import { movieFormatter } from './movieFormatter';
import posterPlaceholder from '../assets/images/poster-placeholder.svg';

const getFullImageUrl = (path) => {
    if (!path || path.includes('default-poster.jpg') || path.includes('no-poster')) return posterPlaceholder;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${serverBase}${cleanPath}`;
};

export const movieMapper = {
    /**
     * Chuyển đổi MovieResponse từ Backend thành MovieViewModel cho View
     * @param {Object} response - Data trả về từ Backend API
     * @returns {Object} MovieViewModel
     */
    toViewModel: (response) => {
        if (!response) return null;
        
        const rawPoster = response.posterPath || response.posterUrl || response.poster;
        const rawBanner = response.bannerPath || response.bannerUrl || response.banner;
        const poster = getFullImageUrl(rawPoster);
        const banner = rawBanner ? getFullImageUrl(rawBanner) : poster;
        
        return {
            id: response.id,
            title: response.title || 'Chưa có tên',
            titleEn: response.titleEn,
            poster: poster,
            banner: banner,
            rawDuration: response.duration,
            duration: movieFormatter.formatDuration(response.duration),
            ageRating: response.ageRating || 'P',
            genres: response.genres ? response.genres.map(g => typeof g === 'string' ? g : (g.name || '')) : [],
            releaseDate: response.releaseDate,
            endDate: response.endDate,
            status: response.status || 'UNKNOWN',
            trailerUrl: response.trailerUrl,
            description: response.description || '',
            director: response.director || 'Đang cập nhật',
            actors: response.actors || 'Đang cập nhật',
            language: response.language || 'Tiếng Việt',
            subtitle: response.subtitle || 'Phụ đề Tiếng Việt',
            rating: movieFormatter.formatRating(response.averageRating ?? response.rating)
        };
    },

    /**
     * Map một danh sách MovieResponse thành mảng MovieViewModel
     * @param {Array} responseList 
     * @returns {Array} Array of MovieViewModel
     */
    toListViewModel: (responseList) => {
        if (!Array.isArray(responseList)) return [];
        return responseList.map(movieMapper.toViewModel);
    }
};
