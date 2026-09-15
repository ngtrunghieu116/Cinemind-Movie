import React from 'react';

const HeroSkeleton = () => {
    return (
        <div className="w-full px-2 sm:px-2.5 pt-2">
            <div className="w-full h-[420px] sm:h-[480px] lg:h-[520px] bg-slate-900 rounded-2xl animate-pulse relative overflow-hidden" />
        </div>
    );
};

export default HeroSkeleton;
