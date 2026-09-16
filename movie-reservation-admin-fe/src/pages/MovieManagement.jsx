import React, { useState, useEffect } from 'react';
import movieApi from '../api/movieApi';
import genreApi from '../api/genreApi';
import Pagination from '../components/Pagination';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Star,
    Film,
    Calendar,
    Clock,
    X,
    Upload,
    Filter,
    Link as LinkIcon,
    Image as ImageIcon
} from 'lucide-react';

const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Pagination
    const [searchTitle, setSearchTitle] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        titleEn: '',
        description: '',
        director: '',
        actors: '',
        duration: 120,
        releaseDate: '',
        endDate: '',
        trailerUrl: '',
        ageRating: 'P',
        language: 'Tiếng Việt',
        subtitle: 'Phụ đề Tiếng Việt',
        status: 'NOW_SHOWING',
        genreIds: []
    });

    // Image source mode: 'FILE' or 'URL'
    const [posterMode, setPosterMode] = useState('FILE'); // 'FILE' | 'URL'
    const [posterFile, setPosterFile] = useState(null);
    const [posterUrl, setPosterUrl] = useState('');
    const [posterPreview, setPosterPreview] = useState(null);

    const [bannerMode, setBannerMode] = useState('FILE'); // 'FILE' | 'URL'
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerUrl, setBannerUrl] = useState('');
    const [bannerPreview, setBannerPreview] = useState(null);
    const [formError, setFormError] = useState('');

    const PLACEHOLDER_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160' viewBox='0 0 120 160'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

    const getFullImageUrl = (path) => {
        if (!path) return PLACEHOLDER_POSTER;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `http://localhost:8080${path}`;
    };

    useEffect(() => {
        fetchGenres();
    }, []);

    useEffect(() => {
        fetchMovies();
    }, [statusFilter, searchTitle, pageNo, pageSize]);

    const fetchGenres = async () => {
        try {
            const data = await genreApi.getAll();
            setGenres(Array.isArray(data) ? data : (data.content || []));
        } catch (err) {
            console.error('Failed to fetch genres:', err);
        }
    };

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const params = {
                page: pageNo,
                size: pageSize
            };
            if (statusFilter) params.status = statusFilter;
            if (searchTitle.trim()) params.search = searchTitle.trim();

            const data = await movieApi.getAll(params);
            if (data && data.content !== undefined) {
                setMovies(data.content);
                setTotalElements(data.totalElements);
                setTotalPages(data.totalPages);
            } else {
                setMovies(data);
                setTotalElements(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách phim. ' + (err.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (movie = null) => {
        setFormError('');
        setPosterFile(null);
        setBannerFile(null);

        if (movie) {
            setIsEditing(true);
            setEditingId(movie.id);
            setFormData({
                title: movie.title || '',
                titleEn: movie.titleEn || '',
                description: movie.description || '',
                director: movie.director || '',
                actors: movie.actors || '',
                duration: movie.duration || 120,
                releaseDate: movie.releaseDate || '',
                endDate: movie.endDate || '',
                trailerUrl: movie.trailerUrl || '',
                ageRating: movie.ageRating || 'P',
                language: movie.language || 'Tiếng Việt',
                subtitle: movie.subtitle || 'Phụ đề Tiếng Việt',
                status: movie.status || 'NOW_SHOWING',
                genreIds: movie.genres ? movie.genres.map(g => g.id) : []
            });

            // Set poster source mode and preview
            const isPosterHttp = movie.posterPath?.startsWith('http');
            if (isPosterHttp) {
                setPosterMode('URL');
                setPosterUrl(movie.posterPath);
                setPosterPreview(movie.posterPath);
            } else {
                setPosterMode('FILE');
                setPosterUrl('');
                setPosterPreview(movie.posterPath ? `http://localhost:8080${movie.posterPath}` : null);
            }

            // Set banner source mode and preview
            const isBannerHttp = movie.bannerPath?.startsWith('http');
            if (isBannerHttp) {
                setBannerMode('URL');
                setBannerUrl(movie.bannerPath);
                setBannerPreview(movie.bannerPath);
            } else {
                setBannerMode('FILE');
                setBannerUrl('');
                setBannerPreview(movie.bannerPath ? `http://localhost:8080${movie.bannerPath}` : null);
            }
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                title: '',
                titleEn: '',
                description: '',
                director: '',
                actors: '',
                duration: 120,
                releaseDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                trailerUrl: '',
                ageRating: 'P',
                language: 'Tiếng Việt',
                subtitle: 'Phụ đề Tiếng Việt',
                status: 'NOW_SHOWING',
                genreIds: genres.length > 0 ? [genres[0].id] : []
            });
            setPosterMode('FILE');
            setPosterUrl('');
            setPosterPreview(null);
            setBannerMode('FILE');
            setBannerUrl('');
            setBannerPreview(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormError('');
        setPosterFile(null);
        setPosterUrl('');
        setPosterPreview(null);
        setBannerFile(null);
        setBannerUrl('');
        setBannerPreview(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setFormError('Dung lượng ảnh poster không được vượt quá 10MB!');
                return;
            }
            if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|gif|avif|svg|bmp|ico|heic|heif|jfif)$/i)) {
                setFormError('File đã chọn không phải là định dạng hình ảnh hợp lệ!');
                return;
            }

            setFormError('');
            setPosterFile(file);
            setPosterPreview(URL.createObjectURL(file));
        }
    };

    const handlePosterUrlChange = (e) => {
        const url = e.target.value;
        setPosterUrl(url);
        setPosterPreview(url.trim() || null);
    };

    const handleBannerFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setFormError('Dung lượng ảnh banner không được vượt quá 10MB!');
                return;
            }
            if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|gif|avif|svg|bmp|ico|heic|heif|jfif)$/i)) {
                setFormError('File đã chọn không phải là định dạng hình ảnh hợp lệ!');
                return;
            }

            setFormError('');
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerUrlChange = (e) => {
        const url = e.target.value;
        setBannerUrl(url);
        setBannerPreview(url.trim() || null);
    };

    const handleGenreToggle = (genreId) => {
        setFormData(prev => {
            const currentIds = prev.genreIds || [];
            if (currentIds.includes(genreId)) {
                return { ...prev, genreIds: currentIds.filter(id => id !== genreId) };
            } else {
                return { ...prev, genreIds: [...currentIds, genreId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // Frontend Validation
        if (!formData.releaseDate || !formData.endDate) {
            setFormError('Vui lòng chọn ngày khởi chiếu và ngày kết thúc!');
            return;
        }

        if (new Date(formData.releaseDate) > new Date(formData.endDate)) {
            setFormError('Ngày khởi chiếu không được diễn ra sau ngày kết thúc!');
            return;
        }

        if (formData.duration <= 0) {
            setFormError('Thời lượng phim phải lớn hơn 0 phút!');
            return;
        }

        if (formData.genreIds.length === 0) {
            setFormError('Vui lòng chọn ít nhất 1 thể loại cho bộ phim!');
            return;
        }

        if (!isEditing) {
            if (posterMode === 'FILE' && !posterFile) {
                setFormError('Vui lòng tải lên ảnh Poster cho bộ phim mới!');
                return;
            }
            if (posterMode === 'URL' && !posterUrl.trim()) {
                setFormError('Vui lòng nhập đường dẫn URL ảnh Poster cho bộ phim mới!');
                return;
            }
        }

        try {
            const data = new FormData();

            const moviePayload = {
                ...formData,
                posterUrl: posterMode === 'URL' && posterUrl.trim() ? posterUrl.trim() : null,
                bannerUrl: bannerMode === 'URL' && bannerUrl.trim() ? bannerUrl.trim() : null,
            };

            // Append movie JSON blob
            const movieBlob = new Blob([JSON.stringify(moviePayload)], { type: 'application/json' });
            data.append('movie', movieBlob);

            if (posterMode === 'FILE' && posterFile) {
                data.append('posterFile', posterFile);
            }

            if (bannerMode === 'FILE' && bannerFile) {
                data.append('bannerFile', bannerFile);
            }

            if (isEditing) {
                await movieApi.update(editingId, data);
            } else {
                await movieApi.create(data);
            }

            fetchMovies();
            handleCloseModal();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin phim!');
        }
    };


    const handleDelete = async (id, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa bộ phim "${title}"?`)) {
            try {
                await movieApi.delete(id);
                fetchMovies();
            } catch (err) {
                alert('Không thể xóa phim. ' + (err.response?.data?.message || ''));
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'NOW_SHOWING':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">Đang chiếu</span>;
            case 'COMING_SOON':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">Sắp chiếu</span>;
            case 'ENDED':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">Đã kết thúc</span>;
            default:
                return null;
        }
    };

    const getAgeRatingBadge = (rating) => {
        switch (rating) {
            case 'P':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">P - Mọi độ tuổi</span>;
            case 'T13':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded border border-yellow-300">13+</span>;
            case 'T16':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded border border-orange-300">16+</span>;
            case 'T18':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded border border-red-300">18+</span>;
            default:
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">{rating}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header & Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Quản Lý Phim
                    </h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                    <Plus size={18} /> <span>Thêm Phim Mới</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên phim..."
                        value={searchTitle}
                        onChange={(e) => {
                            setSearchTitle(e.target.value);
                            setPageNo(0);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPageNo(0);
                        }}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium cursor-pointer"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="NOW_SHOWING">Phim đang chiếu</option>
                        <option value="COMING_SOON">Phim sắp chiếu</option>
                        <option value="ENDED">Phim đã kết thúc</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 m-4 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Poster</th>
                                    <th className="px-5 py-3.5">Tên Phim</th>
                                    <th className="px-5 py-3.5">Thể Loại</th>
                                    <th className="px-5 py-3.5">Thời Lượng</th>
                                    <th className="px-5 py-3.5">Khởi Chiếu</th>
                                    <th className="px-5 py-3.5">Trạng Thái</th>
                                    <th className="px-5 py-3.5">Đánh Giá</th>
                                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {movies.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-12 text-gray-400 font-medium">
                                            Không tìm thấy bộ phim nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    movies.map((movie) => {
                                        const posterUrl = getFullImageUrl(movie.posterPath);

                                        return (
                                            <tr key={movie.id} className="hover:bg-gray-50/50 transition-colors">
                                                {/* 1. Poster */}
                                                <td className="px-5 py-3.5">
                                                    <img
                                                        src={posterUrl}
                                                        alt={movie.title}
                                                        className="w-12 h-16 object-cover rounded-md shadow-2xs border border-gray-200"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = PLACEHOLDER_POSTER;
                                                        }}
                                                    />
                                                </td>

                                                {/* 2. Tên Phim */}
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-gray-900">{movie.title}</div>
                                                    {movie.titleEn && (
                                                        <div className="text-xs text-gray-500 italic mt-0.5">{movie.titleEn}</div>
                                                    )}
                                                    <div className="mt-1">{getAgeRatingBadge(movie.ageRating)}</div>
                                                </td>

                                                {/* 3. Thể Loại */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {movie.genres && movie.genres.map(g => (
                                                            <span key={g.id} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                                {g.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* 4. Thời Lượng */}
                                                <td className="px-5 py-3.5 font-medium text-gray-700">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} className="text-gray-400" />
                                                        {movie.duration} phút
                                                    </div>
                                                </td>

                                                {/* 5. Ngày Khởi Chiếu */}
                                                <td className="px-5 py-3.5 text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {movie.releaseDate}
                                                    </div>
                                                </td>

                                                {/* 6. Trạng Thái */}
                                                <td className="px-5 py-3.5">
                                                    {getStatusBadge(movie.status)}
                                                </td>

                                                {/* 7. Đánh Giá */}
                                                <td className="px-5 py-3.5 font-semibold text-amber-600">
                                                    <div className="flex items-center gap-1">
                                                        <Star size={15} className="fill-amber-400 text-amber-400" />
                                                        {movie.averageRating ? movie.averageRating.toFixed(1) : '5.0'}
                                                    </div>
                                                </td>

                                                {/* 8. Thao Tác */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal(movie)}
                                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                                            title="Sửa phim"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(movie.id, movie.title)}
                                                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                            title="Xóa phim"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Server-side Pagination */}
            {!loading && !error && totalElements > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
                    <Pagination
                        pageNo={pageNo}
                        pageSize={pageSize}
                        totalElements={totalElements}
                        totalPages={totalPages}
                        onPageChange={(newPage) => setPageNo(newPage)}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPageNo(0);
                        }}
                    />
                </div>
            )}

            {/* Modal Add / Edit Movie */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Cập Nhật Thông Tin Phim' : 'Thêm Bộ Phim Mới'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                                    ⚠️ {formError}
                                </div>
                            )}

                            {/* Section 1: Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tên Phim (Tiếng Việt) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ví dụ: Lật Mặt 7: Một Điều Ước"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tên Phim (Tiếng Anh)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        placeholder="Ví dụ: Face Off 7: Wish"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Mô Tả Nôi Dung <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tóm tắt nội dung cốt truyện của bộ phim..."
                                ></textarea>
                            </div>

                            {/* Director & Actors */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Đạo Diễn <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.director}
                                        onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                                        placeholder="Ví dụ: Lý Hải"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Diễn Viên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.actors}
                                        onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                                        placeholder="Ví dụ: Thanh Hằng, Trương Minh Cường..."
                                    />
                                </div>
                            </div>

                            {/* Duration, Release Date, End Date */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Thời Lượng (Phút) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Ngày Khởi Chiếu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.releaseDate}
                                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Ngày Kết Thúc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Rating, Language, Subtitle, Status */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Độ Tuổi <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.ageRating}
                                        onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="P">P - Mọi độ tuổi</option>
                                        <option value="T13">T13 - Khán giả 13+</option>
                                        <option value="T16">T16 - Khán giả 16+</option>
                                        <option value="T18">T18 - Khán giả 18+</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Ngôn Ngữ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Phụ Đề
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Trạng Thái <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="NOW_SHOWING">Phim đang chiếu</option>
                                        <option value="COMING_SOON">Phim sắp chiếu</option>
                                        <option value="ENDED">Phim đã kết thúc</option>
                                    </select>
                                </div>
                            </div>

                            {/* Genres Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Thể Loại Phim <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    {genres.map((g) => {
                                        const isSelected = formData.genreIds.includes(g.id);
                                        return (
                                            <button
                                                type="button"
                                                key={g.id}
                                                onClick={() => handleGenreToggle(g.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {isSelected && <span>✓</span>}
                                                {g.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Poster & Banner Dual-Mode (Upload / URL) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                {/* Poster Input */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Ảnh Poster (2:3) {!isEditing && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => setPosterMode('FILE')}
                                                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                                                    posterMode === 'FILE'
                                                        ? 'bg-white text-blue-600 shadow-xs'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <Upload size={11} className="inline mr-1" /> Tải file
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPosterMode('URL')}
                                                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                                                    posterMode === 'URL'
                                                        ? 'bg-white text-blue-600 shadow-xs'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <LinkIcon size={11} className="inline mr-1" /> Dán link URL
                                            </button>
                                        </div>
                                    </div>

                                    {posterMode === 'FILE' ? (
                                        <div className="flex items-center gap-4">
                                            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 p-3 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50/30 transition-all text-center">
                                                <Upload className="w-5 h-5 text-blue-500 mb-1" />
                                                <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                                                    {posterFile ? posterFile.name : 'Chọn ảnh poster (2:3)'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">
                                                    Mọi định dạng ảnh (PNG, JPG, WEBP, AVIF, GIF, SVG... Max 10MB)
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,.avif,.webp,.svg,.png,.jpg,.jpeg,.gif,.bmp,.ico,.heic,.jfif"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>

                                            {posterPreview && (
                                                <div className="relative w-14 h-20 border border-gray-200 rounded-lg overflow-hidden shrink-0 shadow-xs bg-gray-50">
                                                    <img
                                                        src={posterPreview}
                                                        alt="Poster Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = PLACEHOLDER_POSTER;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <input
                                                    type="url"
                                                    placeholder="https://chieuphimquocgia.com.vn/... hoặc link ảnh bất kỳ"
                                                    value={posterUrl}
                                                    onChange={handlePosterUrlChange}
                                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <span className="text-[10px] text-gray-400 mt-1 block">
                                                    Dán đường link ảnh từ internet/CDN hoặc nguồn cào
                                                </span>
                                            </div>

                                            {posterPreview && (
                                                <div className="relative w-14 h-20 border border-gray-200 rounded-lg overflow-hidden shrink-0 shadow-xs bg-gray-50">
                                                    <img
                                                        src={posterPreview}
                                                        alt="Poster Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = PLACEHOLDER_POSTER;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Banner Input */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Ảnh Banner Ngang (16:9)
                                        </label>
                                        <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => setBannerMode('FILE')}
                                                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                                                    bannerMode === 'FILE'
                                                        ? 'bg-white text-purple-600 shadow-xs'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <Upload size={11} className="inline mr-1" /> Tải file
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBannerMode('URL')}
                                                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                                                    bannerMode === 'URL'
                                                        ? 'bg-white text-purple-600 shadow-xs'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <LinkIcon size={11} className="inline mr-1" /> Dán link URL
                                            </button>
                                        </div>
                                    </div>

                                    {bannerMode === 'FILE' ? (
                                        <div className="flex items-center gap-4">
                                            <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-purple-500 p-3 rounded-lg cursor-pointer bg-gray-50 hover:bg-purple-50/30 transition-all text-center">
                                                <Upload className="w-5 h-5 text-purple-500 mb-1" />
                                                <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                                                    {bannerFile ? bannerFile.name : 'Chọn ảnh banner (16:9)'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">
                                                    Mọi định dạng ảnh (PNG, JPG, WEBP, AVIF, GIF, SVG... Max 10MB)
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,.avif,.webp,.svg,.png,.jpg,.jpeg,.gif,.bmp,.ico,.heic,.jfif"
                                                    onChange={handleBannerFileChange}
                                                    className="hidden"
                                                />
                                            </label>

                                            {bannerPreview && (
                                                <div className="relative w-24 h-14 border border-gray-200 rounded-lg overflow-hidden shrink-0 shadow-xs bg-gray-50">
                                                    <img
                                                        src={bannerPreview}
                                                        alt="Banner Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = PLACEHOLDER_POSTER;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <input
                                                    type="url"
                                                    placeholder="https://chieuphimquocgia.com.vn/... hoặc link banner bất kỳ"
                                                    value={bannerUrl}
                                                    onChange={handleBannerUrlChange}
                                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                                                />
                                                <span className="text-[10px] text-gray-400 mt-1 block">
                                                    Dán đường link banner từ internet/CDN hoặc nguồn cào
                                                </span>
                                            </div>

                                            {bannerPreview && (
                                                <div className="relative w-24 h-14 border border-gray-200 rounded-lg overflow-hidden shrink-0 shadow-xs bg-gray-50">
                                                    <img
                                                        src={bannerPreview}
                                                        alt="Banner Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = PLACEHOLDER_POSTER;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Trailer URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Link Trailer YouTube
                                </label>
                                <input
                                    type="url"
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.trailerUrl}
                                    onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Hủy Bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
                                >
                                    {isEditing ? 'Lưu Thay Đổi' : 'Tạo Phim Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieManagement;
