import React, { useState, useEffect } from 'react';
import MovieDateSelector from '../components/movie/MovieDateSelector';
import MovieNowShowingCard from '../components/movie/MovieNowShowingCard';
import { useNowShowingMovies } from '../hooks/useNowShowingMovies';
import { showtimeApi } from '../api/showtimeApi';
import { AlertCircle, Film, RefreshCw } from 'lucide-react';

const MovieList = () => {
    const [availableDates, setAvailableDates] = useState([]);
    const [isDatesLoading, setIsDatesLoading] = useState(true);
    const [selectedDateStr, setSelectedDateStr] = useState('');

    useEffect(() => {
        let cancelled = false;
        setIsDatesLoading(true);

        showtimeApi.getAvailableDates()
            .then((data) => {
                if (cancelled) return;
                const dates = Array.isArray(data) ? data : [];
                setAvailableDates(dates);
                if (dates.length > 0) {
                    setSelectedDateStr(dates[0]);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to fetch available dates:', err);
                setAvailableDates([]);
            })
            .finally(() => {
                if (!cancelled) setIsDatesLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const {
        movies,
        showtimesByMovie,
        isLoading,
        isError,
        error,
        refetch
    } = useNowShowingMovies(selectedDateStr);

    return (
        <div className="w-full min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Header Section */}
                <div className="text-center space-y-3 pt-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center justify-center gap-3 text-slate-900">
                        <span className="w-3.5 h-3.5 bg-red-600 rounded-full inline-block animate-pulse shadow-md shadow-red-600/40" />
                        <span>LỊCH CHIẾU PHIM</span>
                    </h1>
                </div>

                {/* 2. Date Selector Bar */}
                <MovieDateSelector 
                    availableDates={availableDates}
                    selectedDateStr={selectedDateStr}
                    onSelectDate={setSelectedDateStr}
                    isLoading={isDatesLoading}
                />

                {/* 3. Movie Grid Container */}
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 animate-pulse shadow-xs">
                                <div className="w-full sm:w-1/3 aspect-[2/3] bg-slate-200 rounded-xl" />
                                <div className="w-full sm:w-2/3 space-y-3">
                                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                                    <div className="pt-4 space-y-2">
                                        <div className="h-3 bg-slate-200 rounded w-1/4" />
                                        <div className="flex gap-2">
                                            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                                            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 space-y-4 max-w-md mx-auto shadow-xs">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            Không thể tải danh sách phim. Vui lòng thử lại.
                        </h3>
                        <p className="text-xs text-slate-500">
                            {error?.message || 'Lỗi kết nối máy chủ.'}
                        </p>
                        <button
                            onClick={refetch}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer shadow-md shadow-red-600/30"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Thử lại</span>
                        </button>
                    </div>
                ) : movies.length === 0 ? (
                    <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 space-y-3 max-w-md mx-auto shadow-xs">
                        <Film className="w-12 h-12 text-slate-400 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800">
                            Không có suất chiếu cho ngày đã chọn.
                        </h3>
                        <p className="text-xs text-slate-500">
                            Vui lòng chọn ngày khác trên thanh lịch chiếu để xem các suất chiếu có sẵn!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {movies.map((movie) => (
                            <MovieNowShowingCard
                                key={movie.id}
                                movie={movie}
                                showtimes={showtimesByMovie[movie.id] || []}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default MovieList;
