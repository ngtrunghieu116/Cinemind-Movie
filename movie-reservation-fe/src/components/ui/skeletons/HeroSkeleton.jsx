import React from 'react';

const HeroSkeleton = () => {
    return (
        <div className="w-full px-[50px] pt-4 pb-2">
            <div className="w-full aspect-[1640/720] bg-slate-900 rounded-none animate-pulse relative overflow-hidden" />
        </div>
    );
};

export default HeroSkeleton;
