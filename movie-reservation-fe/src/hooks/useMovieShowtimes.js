import { useState, useEffect, useCallback } from 'react';
import { showtimeApi } from '../api/showtimeApi';

export const useMovieShowtimes = (movieId, selectedDate) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);

    const fetchShowtimes = useCallback(async () => {
        if (!movieId) return;
        setIsLoading(true);
        setIsError(false);
        setError(null);

        try {
            // Construct date range for selectedDate (from 00:00:00 to 23:59:59)
            let fromDateStr = undefined;
            let toDateStr = undefined;

            if (selectedDate) {
                const dateObj = new Date(selectedDate);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                
                fromDateStr = `${year}-${month}-${day}T00:00:00`;
                toDateStr = `${year}-${month}-${day}T23:59:59`;
            }

            const response = await showtimeApi.getShowtimes({
                movieId,
                fromDate: fromDateStr,
                toDate: toDateStr,
                page: 0,
                size: 50
            });

            // If Paginated response
            const showtimeList = response.content || response || [];
            setData(showtimeList);
        } catch (err) {
            console.error(`Failed to fetch showtimes for movieId=${movieId}:`, err);
            setIsError(true);
            setError(err.message || 'Không thể tải lịch chiếu');
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [movieId, selectedDate]);

    useEffect(() => {
        fetchShowtimes();
    }, [fetchShowtimes]);

    return {
        data,
        isLoading,
        isError,
        error,
        refetch: fetchShowtimes
    };
};
