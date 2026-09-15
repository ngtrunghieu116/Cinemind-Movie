import React, { useState, useEffect } from 'react';
import { Play, ChevronRight, ChevronUp, Star } from 'lucide-react';
import reviewApi from '../../api/reviewApi';
import posterPlaceholder from '../../assets/images/poster-placeholder.svg';

const AGE_RATING_CONFIG = {
    P: { label: 'P', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Phổ biến cho mọi lứa tuổi' },
    K: { label: 'K', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Dưới 13 tuổi cần phụ huynh đi kèm' },
    T13: { label: 'T13', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Cấm khán giả dưới 13 tuổi' },
    C13: { label: 'T13', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Cấm khán giả dưới 13 tuổi' },
    T16: { label: 'T16', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', desc: 'Cấm khán giả dưới 16 tuổi' },
    C16: { label: 'T16', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', desc: 'Cấm khán giả dưới 16 tuổi' },
    T18: { label: 'T18', color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Cấm khán giả dưới 18 tuổi' },
    C18: { label: 'T18', color: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Cấm khán giả dưới 18 tuổi' }
};

const MovieDetailHero = ({ movie, onOpenTrailer }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [ratingSummary, setRatingSummary] = useState(null);

    useEffect(() => {
        if (movie?.id) {
            reviewApi.getMovieRatingSummary(movie.id)
                .then(data => setRatingSummary(data))
                .catch(err => console.error('Lỗi khi tải điểm đánh giá hero:', err));
        }
    }, [movie?.id]);

    if (!movie) return null;

    const ageConfig = AGE_RATING_CONFIG[movie.ageRating] || AGE_RATING_CONFIG.P;
    const isComingSoon = movie.status === 'COMING_SOON';
    const isEnded = movie.status === 'ENDED';

    const backdropImage = movie.banner || movie.poster;

    return (
        <div className="relative w-full bg-slate-950 text-white overflow-hidden border-b border-slate-800/60">
            {/* Clearer Cinematic Backdrop Banner */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-55 filter blur-xs scale-105 transition-all duration-700"
                style={{ backgroundImage: `url(${backdropImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />

            {/* Main Layout Container */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <div className="flex flex-col md:flex-row items-start gap-8 lg:gap-12">
                    
                    {/* Left: Poster Card (Main Visual Emphasis, 220-250px desktop) */}
                    <div className="flex-shrink-0 w-full md:w-[240px] lg:w-[260px] mx-auto md:mx-0 max-w-[260px]">
                        <div className="group relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 aspect-[2/3] bg-slate-900">
                            <img 
                                src={movie.poster} 
                                alt={movie.title}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = posterPlaceholder;
                                }}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Play Trailer Overlay Button on Poster */}
                            {movie.trailerUrl && (
                                <button
                                    onClick={onOpenTrailer}
                                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer"
                                    aria-label="Xem Trailer"
                                >
                                    <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transform scale-90 group-hover:scale-100 transition-transform">
                                        <Play className="w-6 h-6 fill-white ml-0.5" />
                                    </div>
                                </button>
                            )}

                            {/* Status Badge in Top Left */}
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase backdrop-blur-md border shadow-md ${
                                    isComingSoon 
                                        ? 'bg-amber-500/90 text-amber-950 border-amber-400' 
                                        : isEnded
                                        ? 'bg-slate-800/90 text-slate-300 border-slate-600'
                                        : 'bg-red-600/90 text-white border-red-500'
                                }`}>
                                    {isComingSoon ? 'SẮP CHIẾU' : isEnded ? 'ĐÃ KẾT THÚC' : 'ĐANG CHIẾU'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Clean Text-based Movie Information (No heavy card boxes) */}
                    <div className="flex-1 space-y-4">
                        
                        {/* Title & Format Badge */}
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight uppercase leading-tight">
                                {movie.title}
                            </h1>
                            <span className="px-2.5 py-0.5 bg-red-600 text-white font-bold text-xs rounded-md uppercase tracking-wide border border-red-500 shadow-sm">
                                2D
                            </span>

                            {/* Rating Star Badge */}
                            {ratingSummary && (
                                <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full text-xs text-amber-400 font-bold backdrop-blur-xs shadow-xs">
                                    <Star size={13} className="fill-amber-400 text-amber-400" />
                                    <span>{ratingSummary.averageRating ? ratingSummary.averageRating.toFixed(1) : '0.0'} / 5</span>
                                    <span className="text-slate-400 font-normal">({ratingSummary.totalReviews || 0} đánh giá)</span>
                                </div>
                            )}
                        </div>

                        {movie.titleEn && (
                            <p className="text-sm text-slate-400 font-medium -mt-2">
                                {movie.titleEn}
                            </p>
                        )}

                        {/* Clean Text Metadata (No Card Boxes) */}
                        <div className="space-y-2 text-sm text-slate-300 pt-1">
                            {/* Duration & Director */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-bold text-white bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700/80 text-xs">
                                    {movie.duration}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">Đạo diễn:</span>
                                <span className="font-semibold text-slate-200">{movie.director}</span>
                            </div>

                            {/* Actors */}
                            <div className="flex flex-wrap items-start gap-1.5">
                                <span className="text-slate-400 flex-shrink-0">Diễn viên:</span>
                                <span className="font-semibold text-slate-200">{movie.actors}</span>
                            </div>

                            {/* Release Date */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Khởi chiếu:</span>
                                <span className="font-semibold text-slate-200">{movie.releaseDate || 'Đang cập nhật'}</span>
                            </div>

                            {/* Genres */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Thể loại:</span>
                                <span className="font-semibold text-slate-200">
                                    {movie.genres && movie.genres.length > 0 ? movie.genres.join(', ') : 'Chưa phân loại'}
                                </span>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="pt-2">
                            <p className={`text-slate-300 text-sm leading-relaxed max-w-3xl font-normal transition-all ${
                                isDescriptionExpanded ? '' : 'line-clamp-3'
                            }`}>
                                {movie.description || 'Chưa có thông tin tóm tắt nội dung cho bộ phim này.'}
                            </p>

                            {movie.description && movie.description.length > 150 && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300 transition flex items-center gap-1"
                                >
                                    <span>{isDescriptionExpanded ? 'Thu gọn' : 'Chi tiết nội dung'}</span>
                                    {isDescriptionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                            )}
                        </div>

                        {/* Age Rating / Censorship Line */}
                        <div className="pt-1 flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Kiểm duyệt:</span>
                            <span className={`font-bold px-2.5 py-0.5 rounded-md border text-xs ${ageConfig.color}`}>
                                {ageConfig.label}
                            </span>
                            <span className="text-xs text-slate-400 font-normal">
                                ({ageConfig.desc})
                            </span>
                        </div>

                        {/* Action Buttons: Only Trailer button (Ticket button removed) */}
                        <div className="flex flex-wrap items-center gap-4 pt-3">
                            <button
                                onClick={onOpenTrailer}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/30 transition duration-200 flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-white text-white" />
                                <span>Xem Trailer</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetailHero;
