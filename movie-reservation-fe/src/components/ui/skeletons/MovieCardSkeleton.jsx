import React from 'react';

const MovieCardSkeleton = () => {
    return (
        <div className="w-full flex flex-col gap-3 animate-pulse">
            <div className="w-full aspect-[2/3] bg-slate-200 rounded-xl"></div>
            <div className="flex flex-col gap-2 px-1">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-9 bg-slate-200 rounded-lg mt-2 w-full"></div>
            </div>
        </div>
    );
};

export default MovieCardSkeleton;
