import React, { useState, useEffect } from 'react';
import genreApi from '../api/genreApi';
import Pagination from '../components/Pagination';
import { Edit, Trash2, Plus, Search } from 'lucide-react';

const GenreManagement = () => {
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search & Pagination States
    const [search, setSearch] = useState('');
    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGenre, setCurrentGenre] = useState({ name: '', description: '' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchGenres();
    }, [pageNo, pageSize, search]);

    const fetchGenres = async () => {
        try {
            setLoading(true);
            const data = await genreApi.getAll({
                page: pageNo,
                size: pageSize,
                search: search.trim() || undefined
            });

            if (data && data.content !== undefined) {
                setGenres(data.content);
                setTotalElements(data.totalElements);
                setTotalPages(data.totalPages);
            } else {
                setGenres(data);
                setTotalElements(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách thể loại. ' + (err.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (genre = null) => {
        if (genre) {
            setCurrentGenre(genre);
            setIsEditing(true);
        } else {
            setCurrentGenre({ name: '', description: '' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentGenre({ name: '', description: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await genreApi.update(currentGenre.id, currentGenre);
            } else {
                await genreApi.create(currentGenre);
            }
            fetchGenres();
            handleCloseModal();
        } catch (err) {
            alert('Không thể lưu thể loại: ' + (err.response?.data?.message || ''));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thể loại phim này?')) {
            try {
                await genreApi.delete(id);
                fetchGenres();
            } catch (err) {
                alert('Không thể xóa thể loại: ' + (err.response?.data?.message || ''));
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản Lý Thể Loại Phim</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                    <Plus size={18} /> Thêm Thể Loại
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên thể loại..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageNo(0);
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {error && <div className="bg-red-50 text-red-600 p-4 m-4 rounded-lg text-sm">{error}</div>}

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Tên Thể Loại</th>
                                        <th className="px-6 py-4">Mô Tả</th>
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {genres.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-12 text-gray-400">
                                                Không tìm thấy thể loại phim nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        genres.map((genre) => (
                                            <tr key={genre.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-gray-500">{genre.id}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs border border-blue-100">
                                                        {genre.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 max-w-md truncate">{genre.description || 'Chưa có mô tả'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal(genre)}
                                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                                            title="Sửa"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(genre.id)}
                                                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* NiceAdmin Pagination */}
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
                    </>
                )}
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isEditing ? 'Sửa Thể Loại Phim' : 'Thêm Thể Loại Mới'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg">
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Tên Thể Loại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={currentGenre.name}
                                    onChange={(e) => setCurrentGenre({ ...currentGenre, name: e.target.value })}
                                    placeholder="Ví dụ: Hành động, Hài hước..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô Tả</label>
                                <textarea
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="3"
                                    value={currentGenre.description || ''}
                                    onChange={(e) => setCurrentGenre({ ...currentGenre, description: e.target.value })}
                                    placeholder="Mô tả chi tiết về thể loại này..."
                                ></textarea>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
                                >
                                    {isEditing ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenreManagement;
