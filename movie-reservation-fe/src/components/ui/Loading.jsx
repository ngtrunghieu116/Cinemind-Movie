import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loading = ({ text = 'Đang tải dữ liệu...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
      <p className="text-xs font-medium text-slate-500">{text}</p>
    </div>
  );
};

export const Skeleton = ({ className = '' }) => {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
};

export default Loading;
