import React from 'react';
import MovieCardSkeleton from './MovieCardSkeleton';

const MovieSectionSkeleton = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: count }).map((_, index) => (
                <MovieCardSkeleton key={index} />
            ))}
        </div>
    );
};

export default MovieSectionSkeleton;
