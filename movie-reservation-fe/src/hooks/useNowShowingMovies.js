import { useState, useEffect, useCallback } from 'react';
import { movieService } from '../services/movieService';
import { showtimeService } from '../services/showtimeService';

export const useNowShowingMovies = (selectedDateStr) => {
    const [movies, setMovies] = useState([]);
    const [showtimesByMovie, setShowtimesByMovie] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        try {
            if (!selectedDateStr) {
                setMovies([]);
                setShowtimesByMovie({});
                return;
            }

            // 1. Fetch Showtimes for selected date
            const fromDate = `${selectedDateStr}T00:00:00`;
            const toDate = `${selectedDateStr}T23:59:59`;

            const [allMovies, rawShowtimes] = await Promise.all([
                movieService.getNowShowing().catch(() => []),
                showtimeService.getShowtimes({
                    fromDate,
                    toDate,
                    page: 0,
                    size: 200
                }).catch(() => [])
            ]);

            // Group showtimes by movie ID
            const grouped = (rawShowtimes || []).reduce((acc, st) => {
                const mId = st.movieId;
                if (!acc[mId]) {
                    acc[mId] = [];
                }
                acc[mId].push(st);
                return acc;
            }, {});

            setShowtimesByMovie(grouped);

            // Filter movies: ONLY include movies that have showtimes on this date
            const scheduledMovieIds = new Set(Object.keys(grouped).map(Number));
            const filteredMovies = (allMovies || []).filter(m => scheduledMovieIds.has(m.id));

            // Also check for any movie in showtimes that was not in getNowShowing (e.g. festival/special movies)
            const knownIds = new Set(filteredMovies.map(m => m.id));
            (rawShowtimes || []).forEach(st => {
                if (!knownIds.has(st.movieId)) {
                    knownIds.add(st.movieId);
                    filteredMovies.push({
                        id: st.movieId,
                        title: st.movieTitle,
                        poster: st.moviePoster,
                        duration: st.movieDuration ? `${st.movieDuration} phút` : 'Đang cập nhật',
                        ageRating: st.movieAgeRating || 'P',
                        genres: [],
                        country: 'Đang cập nhật',
                        releaseDate: selectedDateStr
                    });
                }
            });

            setMovies(filteredMovies);
        } catch (err) {
            setIsError(true);
            setError(err.message || 'Không thể tải danh sách phim đang chiếu');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDateStr]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        movies,
        showtimesByMovie,
        isLoading,
        isError,
        error,
        refetch: fetchData
    };
};
