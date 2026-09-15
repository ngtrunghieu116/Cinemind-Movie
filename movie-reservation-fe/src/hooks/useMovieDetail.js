import { useState, useEffect, useCallback } from 'react';
import { movieApi } from '../api/movieApi';
import { movieMapper } from '../utils/movieMapper';

export const useMovieDetail = (id) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setIsError(false);
        setError(null);

        try {
            const response = await movieApi.getMovieById(id);
            const viewModel = movieMapper.toViewModel(response);
            setData(viewModel);
        } catch (err) {
            console.error(`Failed to fetch movie detail ID=${id}:`, err);
            setIsError(true);
            setError(err.message || 'Không thể tải thông tin phim');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return {
        data,
        isLoading,
        isError,
        error,
        refetch: fetchDetail
    };
};
