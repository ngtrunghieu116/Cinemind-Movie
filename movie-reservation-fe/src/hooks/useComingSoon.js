import { useState, useEffect, useCallback } from 'react';
import { movieService } from '../services/movieService';

export const useComingSoon = ({ page = 0, size = 8 } = {}) => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, size: 8, totalPages: 1, totalElements: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchMovies = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const params = { page, size };
            const result = await movieService.getComingSoon(params);

            if (Array.isArray(result)) {
                setData(result);
            } else if (result && Array.isArray(result.content)) {
                setData(result.content);
                setPagination({
                    page: result.page || result.number || 0,
                    size: result.size || 8,
                    totalPages: result.totalPages || 1,
                    totalElements: result.totalElements || result.content.length
                });
            }
        } catch (error) {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [page, size]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    return {
        data,
        pagination,
        isLoading,
        isError,
        refetch: fetchMovies
    };
};
