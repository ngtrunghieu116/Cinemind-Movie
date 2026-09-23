import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSkeleton from '../ui/skeletons/HeroSkeleton';
import posterPlaceholder from '../../assets/images/poster-placeholder.svg';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroCarousel = ({
    movies,
    isLoading,
    isError,
    currentIndex,
    onNext,
    onPrev,
    onSelect,
    onHoverChange
}) => {
    const navigate = useNavigate();

    if (isLoading) return <HeroSkeleton />;

    if (isError || !movies || movies.length === 0) {
        return (
            <div className="w-full px-[50px] pt-4 pb-2">
                <div className="w-full aspect-[1640/720] rounded-none bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
                    <div className="text-center text-white space-y-2">
                        <h2 className="text-2xl font-bold">Chào mừng đến với CineMind</h2>
                        <p className="text-slate-400">Hiện chưa có phim đang chiếu nổi bật.</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentMovie = movies[currentIndex] || movies[0];

    const handleImageError = (e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = posterPlaceholder;
    };

    const handleSlideClick = () => {
        if (currentMovie?.id) {
            navigate(`/movies/${currentMovie.id}`);
        }
    };

    return (
        /* Container spaced 50px equally from both viewport edges, no border, no shadow */
        <div className="w-full px-[50px] pt-4 pb-2">
            {/* Slideshow Frame (Aspect ratio 1640:720 matching image 1:1, square edges, no border, no shadow) */}
            <div
                className="relative w-full aspect-[1640/720] overflow-hidden rounded-none group bg-slate-950 cursor-pointer select-none"
                onClick={handleSlideClick}
                onMouseEnter={() => onHoverChange?.(true)}
                onMouseLeave={() => onHoverChange?.(false)}
                title={currentMovie.title ? `Xem chi tiết phim: ${currentMovie.title}` : 'Xem chi tiết phim'}
            >
                {/* Crossfade Slides - Layered slides for smooth, flicker-free transitions */}
                {movies.map((movie, idx) => {
                    const isCurrent = idx === currentIndex;
                    const bannerImg = movie.banner || movie.poster || posterPlaceholder;
                    return (
                        <div
                            key={movie.id || idx}
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                        >
                            {/* Banner Artwork - 100% fits container with zero cropping and zero bars */}
                            <img
                                src={bannerImg}
                                alt={movie.title || 'Movie Banner'}
                                fetchPriority={idx === 0 ? 'high' : 'auto'}
                                loading={idx === 0 ? 'eager' : 'lazy'}
                                onError={handleImageError}
                                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.01]"
                            />

                            {/* Subtle bottom gradient to blend seamlessly */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                        </div>
                    );
                })}

                {/* Navigation Arrows */}
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 shadow-lg hover:scale-105 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrev();
                    }}
                    aria-label="Previous Slide"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 shadow-lg hover:scale-105 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNext();
                    }}
                    aria-label="Next Slide"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Dot Indicators */}
                <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    {movies.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect?.(idx);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                idx === currentIndex
                                    ? 'bg-red-600 w-8 shadow-sm shadow-red-500/50'
                                    : 'bg-white/40 w-2 hover:bg-white/70'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeroCarousel;
