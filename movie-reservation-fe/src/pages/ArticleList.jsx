import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import articleApi from '../api/articleApi';
import { Newspaper, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';

const ArticleList = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageNo, setPageNo] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 9;

    useEffect(() => {
        fetchArticles();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [pageNo]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const res = await articleApi.getPublicArticles({ page: pageNo, size: pageSize });
            if (res && res.content) {
                setArticles(res.content);
                setTotalPages(res.totalPages);
            } else {
                setArticles([]);
                setTotalPages(0);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách tin tức:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-3 pt-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center justify-center gap-3 text-slate-900">
                        <span className="w-3.5 h-3.5 bg-red-600 rounded-full inline-block animate-pulse shadow-md shadow-red-600/40" />
                        <span>TIN TỨC & BÀI VIẾT ĐIỆN ẢNH</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
                        Cập nhật các thông tin phim mới nhất, sự kiện điện ảnh nóng hổi và chương trình ưu đãi độc quyền tại CineMind.
                    </p>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 animate-pulse space-y-4">
                                <div className="w-full h-48 bg-slate-200 rounded-xl" />
                                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                                <div className="h-4 bg-slate-200 rounded-md w-full" />
                                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
                        <p className="text-slate-500 font-medium">Hiện chưa có bài viết tin tức nào được xuất bản.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((item) => (
                            <Link
                                key={item.id}
                                to={`/articles/${item.id}`}
                                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl hover:border-red-200 transition-all duration-300 flex flex-col"
                            >
                                {/* Thumbnail */}
                                <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
                                    {item.posterUrl ? (
                                        <img
                                            src={item.posterUrl.startsWith('http') ? item.posterUrl : `http://localhost:8080${item.posterUrl}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon size={40} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                                        <Calendar size={12} className="text-red-400" />
                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                    <div className="space-y-2">
                                        <h2 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                                            {item.shortDescription ? item.shortDescription.replace(/<[^>]*>?/gm, '').trim() : ''}
                                        </p>
                                    </div>

                                    <div className="pt-2 flex items-center gap-1.5 text-sm font-bold text-red-600 group-hover:translate-x-1 transition-transform">
                                        <span>Đọc tiếp</span>
                                        <ArrowRight size={15} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-6">
                        <button
                            disabled={pageNo === 0}
                            onClick={() => setPageNo((prev) => Math.max(0, prev - 1))}
                            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Trang trước
                        </button>
                        <span className="text-sm font-medium text-slate-600 px-3">
                            Trang {pageNo + 1} / {totalPages}
                        </span>
                        <button
                            disabled={pageNo >= totalPages - 1}
                            onClick={() => setPageNo((prev) => prev + 1)}
                            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Trang sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleList;
