import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import articleApi from '../api/articleApi';
import { ArrowLeft, Calendar, User, Newspaper, AlertCircle } from 'lucide-react';

const ArticleDetail = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchArticle();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const data = await articleApi.getPublicArticleById(id);
            setArticle(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Không tìm thấy bài viết hoặc bài viết chưa được xuất bản.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 py-16 px-4">
                <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded-md w-32" />
                    <div className="h-10 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-200 rounded-md w-48" />
                    <div className="h-96 bg-slate-200 rounded-2xl w-full" />
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded-md w-full" />
                        <div className="h-4 bg-slate-200 rounded-md w-full" />
                        <div className="h-4 bg-slate-200 rounded-md w-2/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="w-full min-h-screen bg-slate-50 py-20 px-4">
                <div className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài viết</h2>
                    <p className="text-sm text-slate-500">{error || 'Bài viết không tồn tại hoặc đã bị ẩn.'}</p>
                    <Link
                        to="/articles"
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
                    >
                        <ArrowLeft size={16} />
                        Về danh sách tin tức
                    </Link>
                </div>
            </div>
        );
    }

    const cleanTextContent = (text) => {
        if (!text) return '';
        if (text.includes('<') && text.includes('>')) {
            return text.replace(/<[^>]*>?/gm, '').trim();
        }
        return text;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <article className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs space-y-8">
                {/* Back to List Button */}
                <Link
                    to="/articles"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 transition"
                >
                    <ArrowLeft size={16} />
                    <span>Quay lại danh sách tin tức</span>
                </Link>

                {/* Article Header */}
                <div className="space-y-4 border-b border-slate-100 pb-6">
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                        {cleanTextContent(article.title)}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full font-bold">
                            <Newspaper size={14} /> Tin Điện Ảnh
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} /> {article.createdAt ? new Date(article.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : ''}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                            <User size={14} /> Ban Biên Tập CineMind
                        </span>
                    </div>
                </div>

                {/* Short Description Quote Callout */}
                <div className="p-4 sm:p-5 bg-red-50/70 border-l-4 border-red-600 rounded-r-2xl">
                    <p className="text-base sm:text-lg font-medium text-slate-800 italic leading-relaxed">
                        {cleanTextContent(article.shortDescription)}
                    </p>
                </div>

                {/* Featured Poster */}
                {article.posterUrl && (
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 max-h-[500px]">
                        <img
                            src={article.posterUrl.startsWith('http') ? article.posterUrl : `http://localhost:8080${article.posterUrl}`}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Main Content Body */}
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-line space-y-4 font-normal">
                    {cleanTextContent(article.content)}
                </div>

                {/* Article Footer */}
                <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Newspaper size={16} className="text-red-600" />
                        <span>Chuyên mục Tin tức Điện ảnh & Ưu đãi CineMind</span>
                    </div>
                    <Link
                        to="/articles"
                        className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition"
                    >
                        <span>Xem thêm tin tức khác</span>
                        <ArrowLeft size={16} className="rotate-180" />
                    </Link>
                </div>
            </article>
        </div>
    );
};

export default ArticleDetail;
