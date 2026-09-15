import React, { useState, useEffect } from 'react';
import reviewApi from '../api/reviewApi';
import movieApi from '../api/movieApi';
import Pagination from '../components/Pagination';
import { MessageSquare, Search, Eye, EyeOff, Trash2, Star, CheckCircle, XCircle, X, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [selectedMovieId, setSelectedMovieId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchMovies();
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [pageNo, pageSize, selectedMovieId, statusFilter]);

    const fetchMovies = async () => {
        try {
            const res = await movieApi.getAll();
            const list = Array.isArray(res) ? res : (res?.content || []);
            const sortedList = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
            setMovies(sortedList);
        } catch (err) {
            console.error('Không thể tải danh sách phim:', err);
        }
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedMovieId('');
        setStatusFilter('');
        setPageNo(0);
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = {
                page: pageNo,
                size: pageSize,
                movieId: selectedMovieId || undefined,
                status: statusFilter || undefined,
                search: search.trim() || undefined,
            };
            const res = await reviewApi.getAll(params);
            if (res && res.content) {
                setReviews(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            } else {
                setReviews([]);
                setTotalElements(0);
                setTotalPages(0);
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách nhận xét: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPageNo(0);
        fetchReviews();
    };

    const handlePublish = async (review) => {
        try {
            await reviewApi.publish(review.id);
            toast.success(`Đã hiển thị nhận xét của ${review.userFullName || review.userEmail}`);
            if (selectedReview?.id === review.id) {
                setSelectedReview({ ...selectedReview, status: 'PUBLISHED' });
            }
            fetchReviews();
        } catch (err) {
            toast.error('Thao tác thất bại: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleHide = async (review) => {
        try {
            await reviewApi.hide(review.id);
            toast.success(`Đã ẩn nhận xét của ${review.userFullName || review.userEmail}`);
            if (selectedReview?.id === review.id) {
                setSelectedReview({ ...selectedReview, status: 'HIDDEN' });
            }
            fetchReviews();
        } catch (err) {
            toast.error('Thao tác thất bại: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (review) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa nhận xét của ${review.userFullName || review.userEmail}? Nhận xét sẽ được đánh dấu ĐÃ XÓA.`)) {
            return;
        }

        try {
            await reviewApi.delete(review.id);
            toast.success('Đã chuyển trạng thái nhận xét sang ĐÃ XÓA');
            if (selectedReview?.id === review.id) {
                setSelectedReview(null);
            }
            fetchReviews();
        } catch (err) {
            toast.error('Xóa nhận xét thất bại: ' + (err.response?.data?.message || err.message));
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                ))}
            </div>
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PUBLISHED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        Hiển thị
                    </span>
                );
            case 'HIDDEN':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                        Đã ẩn
                    </span>
                );
            case 'DELETED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                        Đã xóa
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                        {status}
                    </span>
                );
        }
    };

    const formatComment = (comment) => {
        if (!comment) return 'Không có bình luận văn bản';
        return comment.replace(/^\[\]\s*/, '').trim();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
                    <MessageSquare className="text-red-600 w-7 h-7" />
                    Kiểm Duyệt Đánh Giá & Nhận Xét
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Theo dõi, kiểm duyệt và quản lý các đánh giá 1-5 sao và ý kiến của khán giả về từng bộ phim.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Tìm theo nội dung, tên user, email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </form>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Movie Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Phim:</label>
                        <select
                            value={selectedMovieId}
                            onChange={(e) => {
                                setSelectedMovieId(e.target.value);
                                setPageNo(0);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 max-w-xs truncate"
                        >
                            <option value="">Tất cả phim ({movies.length})</option>
                            {movies.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Trạng thái:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPageNo(0);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        >
                            <option value="">Tất cả</option>
                            <option value="PUBLISHED">Hiển thị (PUBLISHED)</option>
                            <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
                            <option value="DELETED">Đã xóa (DELETED)</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {(search || selectedMovieId || statusFilter) && (
                        <button
                            onClick={handleClearFilters}
                            className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                            <RotateCcw size={14} /> Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1100px]">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="py-3.5 px-4 w-16 text-center">ID</th>
                                <th className="py-3.5 px-4 w-60">Phim</th>
                                <th className="py-3.5 px-4 w-52">Khách Hàng</th>
                                <th className="py-3.5 px-4 w-36 whitespace-nowrap">Đánh Giá</th>
                                <th className="py-3.5 px-4 min-w-[280px]">Nhận Xét</th>
                                <th className="py-3.5 px-4 w-32 whitespace-nowrap text-center">Xác Thực</th>
                                <th className="py-3.5 px-4 w-32 whitespace-nowrap text-center">Trạng Thái</th>
                                <th className="py-3.5 px-4 text-right w-28 whitespace-nowrap">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-slate-400">
                                        Đang tải danh sách nhận xét...
                                    </td>
                                </tr>
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-slate-400">
                                        Không tìm thấy nhận xét nào.
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 font-bold text-slate-600 text-center">#{r.id}</td>
                                        <td className="py-3.5 px-4">
                                            <p className="font-bold text-slate-800 line-clamp-2 leading-snug" title={r.movieTitle}>
                                                {r.movieTitle || `Phim #${r.movieId}`}
                                            </p>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <p className="font-semibold text-slate-800 truncate" title={r.userFullName}>
                                                {r.userFullName || 'Khách hàng'}
                                            </p>
                                            {r.userEmail && !r.userEmail.startsWith('rev_') && (
                                                <p className="text-xs text-slate-400 truncate" title={r.userEmail}>
                                                    {r.userEmail}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {renderStars(r.rating)}
                                                <span className="text-xs font-bold text-slate-600">{r.rating}/5 sao</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div 
                                                className="cursor-pointer group"
                                                onClick={() => setSelectedReview(r)}
                                                title="Bấm để xem chi tiết nhận xét"
                                            >
                                                <p className="text-slate-700 text-xs sm:text-sm line-clamp-2 italic group-hover:text-red-600 transition">
                                                    "{formatComment(r.comment)}"
                                                </p>
                                                <span className="text-[11px] text-slate-400 mt-1 block group-hover:underline">
                                                    {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''} • Bấm để xem toàn bộ
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {r.verifiedPurchase ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    <CheckCircle size={12} className="shrink-0" /> Đã mua vé
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                                    <XCircle size={12} className="shrink-0" /> Chưa mua
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {getStatusBadge(r.status)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {r.status !== 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handlePublish(r)}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                                                        title="Hiển thị nhận xét"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {r.status === 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handleHide(r)}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200 transition"
                                                        title="Ẩn nhận xét"
                                                    >
                                                        <EyeOff size={16} />
                                                    </button>
                                                )}
                                                {r.status !== 'DELETED' && (
                                                    <button
                                                        onClick={() => handleDelete(r)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                                                        title="Đánh dấu xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Standardized Pagination */}
                {totalElements > 0 && (
                    <Pagination
                        pageNo={pageNo}
                        pageSize={pageSize}
                        totalElements={totalElements}
                        totalPages={totalPages}
                        onPageChange={(page) => setPageNo(page)}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPageNo(0);
                        }}
                    />
                )}
            </div>

            {/* Review Detail Modal */}
            {selectedReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Chi Tiết Đánh Giá #{selectedReview.id}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleString('vi-VN') : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-xs text-slate-400 block font-medium">Bộ Phim:</span>
                                    <span className="font-bold text-slate-800">{selectedReview.movieTitle || `#${selectedReview.movieId}`}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block font-medium">Khách Hàng:</span>
                                    <span className="font-semibold text-slate-800">{selectedReview.userFullName || 'Khách hàng'}</span>
                                    {selectedReview.userEmail && !selectedReview.userEmail.startsWith('rev_') && (
                                        <span className="text-xs text-slate-400 block truncate">{selectedReview.userEmail}</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block font-medium">Đánh Giá:</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {renderStars(selectedReview.rating)}
                                        <span className="font-bold text-slate-700">{selectedReview.rating}/5 sao</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block font-medium">Trạng Thái & Xác Thực:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        {getStatusBadge(selectedReview.status)}
                                        {selectedReview.verifiedPurchase ? (
                                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                Đã mua vé
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                Chưa mua
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wide">
                                    Nội Dung Nhận Xét Đầy Đủ:
                                </label>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                                    {formatComment(selectedReview.comment)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {selectedReview.status !== 'PUBLISHED' && (
                                    <button
                                        onClick={() => handlePublish(selectedReview)}
                                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition flex items-center gap-1.5"
                                    >
                                        <Eye size={14} /> Hiển thị nhận xét
                                    </button>
                                )}
                                {selectedReview.status === 'PUBLISHED' && (
                                    <button
                                        onClick={() => handleHide(selectedReview)}
                                        className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition flex items-center gap-1.5"
                                    >
                                        <EyeOff size={14} /> Ẩn nhận xét
                                    </button>
                                )}
                                {selectedReview.status !== 'DELETED' && (
                                    <button
                                        onClick={() => handleDelete(selectedReview)}
                                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg transition flex items-center gap-1.5"
                                    >
                                        <Trash2 size={14} /> Đánh dấu xóa
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManagement;
