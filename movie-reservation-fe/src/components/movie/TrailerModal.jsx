import React, { useEffect } from 'react';
import { X, Film } from 'lucide-react';

const extractYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const TrailerModal = ({ isOpen, onClose, trailerUrl, movieTitle }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const videoId = extractYoutubeId(trailerUrl);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-center gap-3 text-white">
                        <Film className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-lg truncate">
                            Trailer - {movieTitle || 'Phim'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Đóng (ESC)"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Video Embed Container */}
                <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                    {videoId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                            title={`Trailer - ${movieTitle}`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="text-center p-8 text-slate-400">
                            <Film className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
                            <p className="text-lg font-medium text-slate-300">Không tìm thấy trailer cho bộ phim này.</p>
                            {trailerUrl && (
                                <a 
                                    href={trailerUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-block px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
                                >
                                    Xem trên Youtube
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrailerModal;
