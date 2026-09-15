import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reviewApi from '../../api/reviewApi';
import { useAuth } from '../../context/AuthContext';
import { Star, CheckCircle, MessageSquare, Send, User as UserIcon, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MovieReviewsSection = ({ movieId, movieTitle }) => {
    const { user } = useAuth();

    // Summary & List
    const [summary, setSummary] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [pageNo, setPageNo] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    // User's own review form
    const [myRating, setMyRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [myComment, setMyComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasExistingReview, setHasExistingReview] = useState(false);

    useEffect(() => {
        if (movieId) {
            fetchSummary();
            fetchReviews();
            if (user) {
                fetchMyReview();
            }
        }
    }, [movieId, pageNo, user]);

    const fetchSummary = async () => {
        try {
            const data = await reviewApi.getMovieRatingSummary(movieId);
            setSummary(data);
        } catch (err) {
            console.error('Lỗi khi tải thống kê đánh giá:', err);
        }
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewApi.getMovieReviews(movieId, { page: pageNo, size: 5 });
            if (res && res.content) {
                setReviews(res.content);
                setTotalPages(res.totalPages);
            } else {
                setReviews([]);
                setTotalPages(0);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách nhận xét:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyReview = async () => {
        try {
            const res = await reviewApi.getMyReview(movieId);
            if (res) {
                setMyRating(res.rating || 5);
                setMyComment(res.comment || '');
                setHasExistingReview(true);
            }
        } catch (err) {
            console.error('Lỗi khi tải đánh giá cá nhân:', err);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Vui lòng đăng nhập để gửi đánh giá!');
            return;
        }

        if (myRating < 1 || myRating > 5) {
            toast.error('Vui lòng chọn số sao từ 1 đến 5!');
            return;
        }

        try {
            setIsSubmitting(true);
            await reviewApi.submitReview({
                movieId: Number(movieId),
                rating: myRating,
                comment: myComment.trim() || undefined,
            });

            toast.success(hasExistingReview ? 'Đã cập nhật đánh giá của bạn!' : 'Cảm ơn bạn đã gửi đánh giá!');
            setHasExistingReview(true);
            fetchSummary();
            fetchReviews();
        } catch (err) {
            toast.error('Không thể gửi đánh giá: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStarPercentage = (count) => {
        if (!summary || !summary.totalReviews || summary.totalReviews === 0) return 0;
        return Math.round(((count || 0) / summary.totalReviews) * 100);
    };

    return (
        <section className="w-full max-w-7xl mx-auto mt-16 pt-10 border-t border-slate-200 space-y-10">
            {/* Title */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600">
                    <MessageSquare size={22} />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Đánh Giá & Nhận Xét Từ Khán Giả
                    </h2>
                    <p className="text-sm text-slate-500">
                        Ý kiến thực tế từ những khán giả đã trải nghiệm phim {movieTitle ? `"${movieTitle}"` : ''}
                    </p>
                </div>
            </div>

            {/* Top Grid: Rating Summary + Submit Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Rating Summary Box */}
                <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tổng điểm đánh giá</h3>
                        <div className="flex items-baseline gap-4">
                            <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                                {summary?.averageRating ? summary.averageRating.toFixed(1) : '0.0'}
                            </span>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={20}
                                            className={s <= Math.round(summary?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                                    {summary?.totalReviews || 0} lượt đánh giá đã xác thực
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-100">
                        {[
                            { stars: 5, count: summary?.star5Count || 0 },
                            { stars: 4, count: summary?.star4Count || 0 },
                            { stars: 3, count: summary?.star3Count || 0 },
                            { stars: 2, count: summary?.star2Count || 0 },
                            { stars: 1, count: summary?.star1Count || 0 },
                        ].map((row) => {
                            const percent = getStarPercentage(row.count);
                            return (
                                <div key={row.stars} className="flex items-center gap-3 text-xs">
                                    <span className="w-10 font-bold text-slate-700 flex items-center gap-1">
                                        {row.stars} <Star size={11} className="fill-amber-400 text-amber-400" />
                                    </span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-slate-400 font-medium">
                                        {row.count} ({percent}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Review Form Box */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">
                            {hasExistingReview ? 'Cập nhật đánh giá của bạn' : 'Để lại đánh giá của bạn'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 mb-6">
                            Chia sẻ cảm nhận chân thực về bộ phim để giúp các khán giả khác lựa chọn.
                        </p>

                        {user ? (
                            <form onSubmit={handleSubmitReview} className="space-y-4">
                                {/* Interactive Star Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                        Bạn chấm phim mấy sao?
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setMyRating(star)}
                                                className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                            >
                                                <Star
                                                    size={30}
                                                    className={`transition-colors ${
                                                        (hoverRating || myRating) >= star
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-200'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                        <span className="ml-3 text-sm font-bold text-slate-700">
                                            {hoverRating || myRating} / 5 sao
                                        </span>
                                    </div>
                                </div>

                                {/* Comment Area */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                        Cảm nhận của bạn (tối đa 1000 ký tự)
                                    </label>
                                    <textarea
                                        rows="3"
                                        maxLength={1000}
                                        value={myComment}
                                        onChange={(e) => setMyComment(e.target.value)}
                                        placeholder="Kịch bản, diễn xuất, kỹ xảo hay âm nhạc của phim thế nào?..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-600/20 disabled:opacity-50 transition"
                                    >
                                        <Send size={16} />
                                        <span>{isSubmitting ? 'Đang gửi...' : (hasExistingReview ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá')}</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                                <p className="text-sm font-medium text-slate-600">
                                    Bạn cần đăng nhập để gửi đánh giá và nhận xét cho bộ phim này.
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">
                        Nhận xét từ người xem ({summary?.totalReviews || 0})
                    </h3>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                                <div className="h-4 bg-slate-200 rounded-md w-32" />
                                <div className="h-4 bg-slate-200 rounded-md w-full" />
                            </div>
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-slate-500 font-medium text-sm">Chưa có nhận xét nào cho bộ phim này. Hãy là người đầu tiên đánh giá!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div key={rev.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                            {rev.userFullName ? rev.userFullName.charAt(0).toUpperCase() : <UserIcon size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{rev.userFullName || 'Khán giả CineMind'}</p>
                                            <p className="text-xs text-slate-400">
                                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'numeric',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Verified Purchase Badge */}
                                    {rev.verifiedPurchase && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <CheckCircle size={13} className="text-emerald-600" />
                                            <span>Đã mua vé tại CineMind</span>
                                        </span>
                                    )}
                                </div>

                                {/* Star Rating */}
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={16}
                                            className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                        />
                                    ))}
                                    <span className="text-xs font-bold text-slate-600 ml-1.5">{rev.rating}/5 sao</span>
                                </div>

                                {/* Comment */}
                                {rev.comment && (
                                    <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                        {rev.comment}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-4">
                        <button
                            disabled={pageNo === 0}
                            onClick={() => setPageNo((prev) => Math.max(0, prev - 1))}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
                        >
                            Trang trước
                        </button>
                        <span className="text-xs font-medium text-slate-600 px-2">
                            Trang {pageNo + 1} / {totalPages}
                        </span>
                        <button
                            disabled={pageNo >= totalPages - 1}
                            onClick={() => setPageNo((prev) => prev + 1)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
                        >
                            Trang sau
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MovieReviewsSection;
