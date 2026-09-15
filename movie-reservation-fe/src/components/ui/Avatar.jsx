import React from 'react';

const Avatar = ({ src, name = 'User', size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-slate-200 ${sizes[size] || sizes.md} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-red-600 text-white font-bold flex items-center justify-center shadow-xs ${sizes[size] || sizes.md} ${className}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;
