import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import articleApi from '../../api/articleApi';
import { Calendar, ArrowRight, Newspaper, RotateCw, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';

const PromotionSection = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLatestArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await articleApi.getPublicArticles({ page: 0, size: 3 });
            if (res && Array.isArray(res.content)) {
                setArticles(res.content);
            } else if (Array.isArray(res)) {
                setArticles(res.slice(0, 3));
            } else {
                setArticles([]);
            }
        } catch (err) {
            console.error('Lỗi khi tải bài viết mới nhất cho Homepage:', err);
            setError('Không thể tải danh sách bài viết mới nhất.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLatestArticles();
    }, [fetchLatestArticles]);

    return (
        <section className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-bold text-slate-900">Khuyến Mãi & Sự Kiện</h2>
                </div>
                <Link 
                    to="/articles" 
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors group cursor-pointer"
                >
                    <span>Xem tất cả</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            
            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-xs p-3 space-y-3 animate-pulse">
                            <div className="aspect-[16/9] w-full bg-slate-200 rounded-lg" />
                            <div className="space-y-2 py-1">
                                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                                <div className="h-3 bg-slate-200 rounded-md w-full" />
                                <div className="h-3 bg-slate-200 rounded-md w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-3">
                    <p className="text-sm text-slate-500">{error}</p>
                    <Button variant="outline" size="sm" icon={RotateCw} onClick={fetchLatestArticles}>
                        Thử lại
                    </Button>
                </div>
            ) : articles.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-2">
                    <Newspaper className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">Hiện chưa có bài viết sự kiện nào được xuất bản.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {articles.map((item) => {
                        const rawUrl = item.posterUrl;
                        const imageUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `http://localhost:8080${rawUrl}`) : null;
                        const cleanDesc = item.shortDescription 
                            ? item.shortDescription.replace(/<[^>]*>?/gm, '').trim() 
                            : '';
                        const dateFormatted = item.createdAt 
                            ? new Date(item.createdAt).toLocaleDateString('vi-VN') 
                            : '';

                        return (
                            <Link 
                                key={item.id} 
                                to={`/articles/${item.id}`}
                                className="group bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col"
                            >
                                <div className="aspect-[16/9] overflow-hidden relative bg-slate-100">
                                    {imageUrl ? (
                                        <img 
                                            src={imageUrl} 
                                            alt={item.title} 
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
                                            }}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon size={36} />
                                        </div>
                                    )}
                                    {dateFormatted && (
                                        <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm flex items-center gap-1.5">
                                            <Calendar size={11} className="text-red-400" />
                                            <span>{dateFormatted}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                                    <div className="space-y-1.5">
                                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                            {item.title}
                                        </h3>
                                        {cleanDesc && (
                                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                                                {cleanDesc}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-2 pt-1 flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                                        <span>Xem chi tiết</span>
                                        <ArrowRight size={13} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default PromotionSection;
