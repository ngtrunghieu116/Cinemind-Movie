import React, { useState, useEffect } from 'react';
import articleApi from '../api/articleApi';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, FileText, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ArticleManagement = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        content: '',
        status: 'DRAFT',
    });
    const [posterFile, setPosterFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, [pageNo, pageSize, statusFilter]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = {
                page: pageNo,
                size: pageSize,
                status: statusFilter || undefined,
                search: search.trim() || undefined,
            };
            const res = await articleApi.getAll(params);
            if (res && res.content) {
                setArticles(res.content);
                setTotalElements(res.totalElements);
                setTotalPages(res.totalPages);
            } else {
                setArticles([]);
                setTotalElements(0);
                setTotalPages(0);
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách bài viết: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPageNo(0);
        fetchArticles();
    };

    const handleOpenModal = (article = null) => {
        if (article) {
            setIsEditing(true);
            setCurrentId(article.id);
            setFormData({
                title: article.title,
                shortDescription: article.shortDescription,
                content: article.content,
                status: article.status || 'DRAFT',
            });
            setPreviewUrl(article.posterUrl ? (article.posterUrl.startsWith('http') ? article.posterUrl : `http://localhost:8080${article.posterUrl}`) : '');
            setPosterFile(null);
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setFormData({
                title: '',
                shortDescription: '',
                content: '',
                status: 'DRAFT',
            });
            setPreviewUrl('');
            setPosterFile(null);
        }
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Dung lượng ảnh vượt quá 5MB!');
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            toast.error('Chỉ chấp nhận ảnh JPEG, PNG, WEBP!');
            return;
        }

        setPosterFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài viết!');
            return;
        }
        if (!formData.shortDescription.trim()) {
            toast.error('Vui lòng nhập mô tả ngắn!');
            return;
        }
        if (!formData.content.trim()) {
            toast.error('Vui lòng nhập nội dung bài viết!');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title.trim());
        data.append('shortDescription', formData.shortDescription.trim());
        data.append('content', formData.content.trim());
        data.append('status', formData.status);
        if (posterFile) {
            data.append('poster', posterFile);
        }

        try {
            setSubmitting(true);
            if (isEditing) {
                await articleApi.update(currentId, data);
                toast.success('Cập nhật bài viết thành công!');
            } else {
                await articleApi.create(data);
                toast.success('Tạo bài viết mới thành công!');
            }
            setIsModalOpen(false);
            fetchArticles();
        } catch (err) {
            toast.error('Thao tác thất bại: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePublish = async (article) => {
        try {
            if (article.status === 'PUBLISHED') {
                await articleApi.hide(article.id);
                toast.success(`Đã chuyển bài viết "${article.title}" sang trạng thái ẨN`);
            } else {
                await articleApi.publish(article.id);
                toast.success(`Đã xuất bản bài viết "${article.title}"`);
            }
            fetchArticles();
        } catch (err) {
            toast.error('Không thể đổi trạng thái: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (article) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}"? Thao tác này không thể hoàn tác!`)) {
            return;
        }

        try {
            await articleApi.delete(article.id);
            toast.success('Đã xóa bài viết thành công!');
            fetchArticles();
        } catch (err) {
            toast.error('Xóa bài viết thất bại: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PUBLISHED':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Xuất bản</span>;
            case 'HIDDEN':
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Đã ẩn</span>;
            case 'DRAFT':
            default:
                return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Bản nháp</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Quản Lý Tin Tức
                    </h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                >
                    <Plus size={18} />
                    <span>Tạo Bài Viết Mới</span>
                </button>
            </div>

            {/* Filter & Search */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Tìm theo tiêu đề bài viết..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </form>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Trạng thái:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPageNo(0);
                        }}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium cursor-pointer"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                        <option value="DRAFT">Bản nháp (DRAFT)</option>
                        <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
                    </select>
                </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="py-3.5 px-4 w-16">ID</th>
                                <th className="py-3.5 px-4 w-24">Ảnh Bìa</th>
                                <th className="py-3.5 px-4">Tiêu Đề</th>
                                <th className="py-3.5 px-4 w-40">Trạng Thái</th>
                                <th className="py-3.5 px-4 w-36">Ngày Tạo</th>
                                <th className="py-3.5 px-4 text-right w-44">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">
                                        Đang tải danh sách bài viết...
                                    </td>
                                </tr>
                            ) : articles.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">
                                        Không tìm thấy bài viết nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                articles.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-gray-600">{item.id}</td>
                                        <td className="py-3.5 px-4">
                                            {item.posterUrl ? (
                                                <img
                                                    src={item.posterUrl.startsWith('http') ? item.posterUrl : `http://localhost:8080${item.posterUrl}`}
                                                    alt={item.title}
                                                    className="w-16 h-12 object-cover rounded-lg border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-16 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <p className="font-bold text-gray-800 line-clamp-1">{item.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.shortDescription}</p>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleTogglePublish(item)}
                                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${item.status === 'PUBLISHED'
                                                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                        }`}
                                                    title={item.status === 'PUBLISHED' ? 'Chuyển thành bản nháp' : 'Xuất bản bài viết'}
                                                >
                                                    {item.status === 'PUBLISHED' ? <EyeOff size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                                                    title="Xóa bài viết"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Server-side Pagination */}
            {!loading && totalPages > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
                    <Pagination
                        currentPage={pageNo}
                        totalPages={totalPages}
                        onPageChange={(page) => setPageNo(page)}
                    />
                </div>
            )}

            {/* Modal Create / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                            {isEditing ? 'Chỉnh Sửa Bài Viết' : 'Tạo Bài Viết Mới'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Tiêu đề bài viết <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    placeholder="Nhập tiêu đề hấp dẫn..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Mô tả ngắn <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="2"
                                    required
                                    value={formData.shortDescription}
                                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    placeholder="Tóm tắt ngắn gọn 1-2 câu về bài viết..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Ảnh Poster / Thumbnail (tối đa 5MB)
                                </label>
                                <div className="flex items-center gap-4">
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-24 h-16 object-cover rounded-xl border border-slate-200 shadow-xs"
                                        />
                                    )}
                                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer text-sm font-medium transition">
                                        <Upload size={16} />
                                        <span>{posterFile ? posterFile.name : 'Chọn ảnh mới'}</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái bài viết</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    >
                                        <option value="DRAFT">Bản nháp (DRAFT)</option>
                                        <option value="PUBLISHED">Xuất bản ngay (PUBLISHED)</option>
                                        <option value="HIDDEN">Tạm ẩn (HIDDEN)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Nội dung chi tiết <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="8"
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                                    placeholder="Nhập nội dung đầy đủ của bài viết..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-600/20 disabled:opacity-50 transition"
                                >
                                    {submitting ? 'Đang lưu...' : (isEditing ? 'Cập Nhật Bài Viết' : 'Tạo Bài Viết')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleManagement;
