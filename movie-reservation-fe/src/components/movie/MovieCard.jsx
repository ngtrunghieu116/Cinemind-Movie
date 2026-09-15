import React, { memo, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import posterPlaceholder from '../../assets/images/poster-placeholder.svg';
import { Star } from 'lucide-react';
import reviewApi from '../../api/reviewApi';

const MovieCard = memo(({ movie }) => {
    const navigate = useNavigate();

    if (!movie) return null;

    const {
        id,
        title,
        poster,
        duration,
        ageRating,
        genres,
        rating
    } = movie;

    const [ratingSummary, setRatingSummary] = useState(null);

    useEffect(() => {
        let isMounted = true;
        if (id) {
            reviewApi.getMovieRatingSummary(id)
                .then(res => {
                    if (isMounted && res) {
                        setRatingSummary(res);
                    }
                })
                .catch(() => {});
        }
        return () => { isMounted = false; };
    }, [id]);

    const displayRating = useMemo(() => {
        if (ratingSummary && ratingSummary.averageRating !== undefined && ratingSummary.averageRating !== null) {
            return `(${Number(ratingSummary.averageRating).toFixed(1)}/5.0)`;
        }
        return rating || '(5.0/5.0)';
    }, [ratingSummary, rating]);

    const handleClick = () => {
        navigate(`/movies/${id}`);
    };

    const handleBookClick = (e) => {
        e.stopPropagation();
        navigate(`/movies/${id}`);
    };

    const handleImageError = (e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = posterPlaceholder;
    };

    return (
        <div 
            className="group flex flex-col bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer"
            onClick={handleClick}
        >
            {/* Poster */}
            <div className="relative w-full aspect-[2/3] overflow-hidden bg-slate-100">
                <img
                    src={poster || posterPlaceholder}
                    alt={title}
                    loading="lazy"
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Age Rating Badge */}
                {ageRating && (
                    <div className="absolute top-2 left-2 z-10">
                        <Badge variant={ageRating === '18+' ? 'danger' : 'info'}>
                            {ageRating}
                        </Badge>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button variant="primary" size="md" onClick={handleBookClick}>
                        Đặt Vé
                    </Button>
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1.5 p-3">
                <h3 className="text-slate-900 font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors" title={title}>
                    {title}
                </h3>
                
                <div className="flex items-center text-xs text-slate-500 gap-1.5">
                    <span className="truncate">{genres?.slice(0, 2).join(', ') || 'Thể loại'}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{duration}</span>
                </div>
                
                <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                    <Star size={13} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                    <span>{displayRating}</span>
                </div>
            </div>
        </div>
    );
});

export default MovieCard;
