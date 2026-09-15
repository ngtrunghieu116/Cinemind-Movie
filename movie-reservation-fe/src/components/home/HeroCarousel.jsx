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
            <div className="w-full px-2 sm:px-2.5 pt-2">
                <div className="w-full h-[420px] sm:h-[480px] lg:h-[520px] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
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

    // Poster type landscape (banner horizontal) with fallback to poster
    const landscapePoster = currentMovie.banner || currentMovie.poster || posterPlaceholder;

    return (
        /* Dedicated Container with 8px-10px equal horizontal spacing from viewport */
        <div className="w-full px-2 sm:px-2.5 pt-2">
            {/* Slideshow (width: 100% of container) */}
            <div
                className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden rounded-2xl group bg-slate-950 cursor-pointer select-none"
                onClick={handleSlideClick}
                onMouseEnter={() => onHoverChange?.(true)}
                onMouseLeave={() => onHoverChange?.(false)}
                title={currentMovie.title ? `Xem chi tiết phim: ${currentMovie.title}` : 'Xem chi tiết phim'}
            >
                {/* Full-bleed Landscape Poster Image Only (Không hiển thị text đè lên ảnh) */}
                <div className="absolute inset-0">
                    <img
                        key={currentMovie.id}
                        src={landscapePoster}
                        alt={currentMovie.title}
                        fetchpriority="high"
                        onError={handleImageError}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    />
                </div>

                {/* Navigation Arrows */}
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 shadow-lg"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrev();
                    }}
                    aria-label="Previous Slide"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 shadow-lg"
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
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {movies.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect?.(idx);
                            }}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                                    ? 'bg-red-600 w-8 shadow-sm shadow-red-500'
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
