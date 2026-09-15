import React from 'react';
import MovieCard from './MovieCard';
import MovieSectionSkeleton from '../ui/skeletons/MovieSectionSkeleton';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { Film, RefreshCw } from 'lucide-react';

const MovieSection = ({ title, movies, isLoading, isError, onRetry }) => {
    
    const renderHeader = () => (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-primary rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            </div>
        </div>
    );

    // State: Error
    if (isError) {
        return (
            <section>
                {renderHeader()}
                <div className="w-full flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                        <RefreshCw size={24} />
                    </div>
                    <p className="text-slate-700 font-semibold mb-1">Không thể tải danh sách phim</p>
                    <p className="text-sm text-slate-500 mb-5">Vui lòng kiểm tra kết nối và thử lại.</p>
                    <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
                        Tải lại
                    </Button>
                </div>
            </section>
        );
    }

    // State: Loading
    if (isLoading) {
        return (
            <section>
                {renderHeader()}
                <MovieSectionSkeleton count={5} />
            </section>
        );
    }

    // State: Empty
    if (!movies || movies.length === 0) {
        return (
            <section>
                {renderHeader()}
                <EmptyState 
                    title="Hiện chưa có phim"
                    description="Hệ thống đang cập nhật danh sách phim mới nhất. Quay lại sau nhé!"
                    icon={Film}
                />
            </section>
        );
    }

    // State: Content
    return (
        <section>
            {renderHeader()}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {movies.map((movie) => (
                    <MovieCard 
                        key={movie.id} 
                        movie={movie}
                    />
                ))}
            </div>
        </section>
    );
};

export default MovieSection;
