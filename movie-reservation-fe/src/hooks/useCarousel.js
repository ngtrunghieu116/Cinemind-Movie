import { useState, useEffect, useCallback } from 'react';

export const useCarousel = (itemCount, interval = 5000) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        if (itemCount > 0) {
            setCurrentIndex((prev) => (prev + 1) % itemCount);
        }
    }, [itemCount]);

    const prevSlide = useCallback(() => {
        if (itemCount > 0) {
            setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount);
        }
    }, [itemCount]);

    // Auto-slide
    useEffect(() => {
        if (!isHovered && itemCount > 0) {
            const timer = setInterval(nextSlide, interval);
            return () => clearInterval(timer);
        }
    }, [isHovered, nextSlide, itemCount, interval]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    return {
        currentIndex,
        setCurrentIndex,
        nextSlide,
        prevSlide,
        setIsHovered
    };
};
