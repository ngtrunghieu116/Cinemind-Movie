import React, { useMemo } from 'react';
import { useNowShowing } from '../hooks/useNowShowing';
import { useComingSoon } from '../hooks/useComingSoon';
import { useCarousel } from '../hooks/useCarousel';
import HeroCarousel from '../components/home/HeroCarousel';
import MovieSection from '../components/movie/MovieSection';
import PromotionSection from '../components/home/PromotionSection';

const Home = () => {
    // 1. hooks
    const { 
        data: nowShowingMovies, 
        isLoading: isNowShowingLoading, 
        isError: isNowShowingError, 
        refetch: refetchNowShowing 
    } = useNowShowing({ size: 10 });

    const { 
        data: comingSoonMovies, 
        isLoading: isComingSoonLoading, 
        isError: isComingSoonError, 
        refetch: refetchComingSoon 
    } = useComingSoon({ size: 10 });

    // 2. memo
    const heroMovies = useMemo(() => {
        if (!nowShowingMovies || nowShowingMovies.length === 0) return [];
        return nowShowingMovies.slice(0, 8);
    }, [nowShowingMovies]);

    const {
        currentIndex,
        nextSlide,
        prevSlide,
        setCurrentIndex,
        setIsHovered
    } = useCarousel(heroMovies.length, 5000);

    // 3. render
    return (
        <div className="w-full min-h-screen">
            {/* Hero - full width, dark cinematic overlay */}
            <HeroCarousel 
                movies={heroMovies}
                isLoading={isNowShowingLoading}
                isError={isNowShowingError}
                currentIndex={currentIndex}
                onNext={nextSlide}
                onPrev={prevSlide}
                onSelect={setCurrentIndex}
                onHoverChange={setIsHovered}
            />
            
            {/* Main Content - light theme, contained */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                <MovieSection 
                    title="Phim Đang Chiếu"
                    movies={nowShowingMovies}
                    isLoading={isNowShowingLoading}
                    isError={isNowShowingError}
                    onRetry={refetchNowShowing}
                />

                <MovieSection 
                    title="Phim Sắp Chiếu"
                    movies={comingSoonMovies}
                    isLoading={isComingSoonLoading}
                    isError={isComingSoonError}
                    onRetry={refetchComingSoon}
                />
                
                <PromotionSection />
            </div>
        </div>
    );
};

export default Home;
