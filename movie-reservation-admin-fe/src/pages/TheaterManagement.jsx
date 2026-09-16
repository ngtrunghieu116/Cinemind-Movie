import React, { useState, useEffect } from 'react';
import theaterApi from '../api/theaterApi';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash2, Building2, MapPin, Phone, Mail, X, DoorClosed } from 'lucide-react';
import RoomManagement from './RoomManagement';

const TheaterManagement = () => {
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedTheaterForRooms, setSelectedTheaterForRooms] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: 'Hà Nội',
        district: '',
        phone: '',
        email: '',
        description: '',
        isActive: true
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchTheaters();
    }, [pageNo, pageSize, search]);

    const fetchTheaters = async () => {
        try {
            setLoading(true);
            const data = await theaterApi.getAll({
                page: pageNo,
                size: pageSize,
                search: search.trim() || undefined
            });

            if (data && data.content !== undefined) {
                setTheaters(data.content);
                setTotalElements(data.totalElements);
                setTotalPages(data.totalPages);
            } else {
                setTheaters(data);
                setTotalElements(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách cơ sở rạp. ' + (err.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (theater = null) => {
        setFormError('');
        if (theater) {
            setIsEditing(true);
            setEditingId(theater.id);
            setFormData({
                name: theater.name || '',
                address: theater.address || '',
                city: theater.city || 'Hà Nội',
                district: theater.district || '',
                phone: theater.phone || '',
                email: theater.email || '',
                description: theater.description || '',
                isActive: theater.isActive !== undefined ? theater.isActive : true
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                name: 'Trung Tâm Chiếu Phim ABC ',
                address: '87 Láng Hạ',
                city: 'Hà Nội',
                district: 'Ba Đình',
                phone: '02435141791',
                email: 'contact@chieuphimABC.com.vn',
                description: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.district.trim() || !formData.phone.trim()) {
            setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
            return;
        }

        try {
            if (isEditing) {
                await theaterApi.update(editingId, formData);
            } else {
                await theaterApi.create(formData);
            }
            fetchTheaters();
            handleCloseModal();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Không thể lưu thông tin cơ sở rạp!');
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa cơ sở rạp "${name}"?`)) {
            try {
                await theaterApi.delete(id);
                fetchTheaters();
            } catch (err) {
                alert('Không thể xóa cơ sở rạp: ' + (err.response?.data?.message || ''));
            }
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản Lý Cơ Sở Rạp</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                    <Plus size={18} /> <span>Thêm Cơ Sở Mới</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tên cơ sở, địa chỉ, thành phố..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageNo(0);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                {error && <div className="bg-red-50 text-red-600 p-4 m-4 rounded-xl text-sm">{error}</div>}

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3.5">ID</th>
                                    <th className="px-5 py-3.5">Tên Cơ Sở Rạp</th>
                                    <th className="px-5 py-3.5">Địa Chỉ</th>
                                    <th className="px-5 py-3.5">Khu Vực</th>
                                    <th className="px-5 py-3.5">Liên Hệ</th>
                                    <th className="px-5 py-3.5">Trạng Thái</th>
                                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {theaters.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-gray-400 font-medium">
                                            Không tìm thấy cơ sở rạp nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    theaters.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-gray-500">{t.id}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-semibold text-gray-900">{t.name}</div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-700">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-gray-400 shrink-0" />
                                                    {t.address}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-700 font-medium">
                                                {t.district}, {t.city}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col text-xs space-y-1">
                                                    <span className="flex items-center gap-1 text-gray-700 font-medium">
                                                        <Phone size={12} className="text-gray-400" /> {t.phone}
                                                    </span>
                                                    {t.email && (
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            <Mail size={12} className="text-gray-400" /> {t.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {t.isActive ? (
                                                    <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                                                        Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                                                        Tạm dừng
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedTheaterForRooms(t)}
                                                        className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                                                        title="Quản lý phòng chiếu"
                                                    >
                                                        <DoorClosed size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(t)}
                                                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Sửa cơ sở"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id, t.name)}
                                                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Xóa cơ sở"
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

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isEditing ? 'Cập Nhật Thông Tin Cơ Sở' : 'Thêm Cơ Sở Rạp Mới'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium">
                                    ⚠️ {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Tên Cơ Sở / Rạp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ví dụ: Trung Tâm Chiếu Phim Quốc Gia - Láng Hạ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Địa Chỉ Chi Tiết <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Ví dụ: 87 Láng Hạ"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Thành Phố <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Ví dụ: Hà Nội"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Phường <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        placeholder="Ví dụ: Nghĩa Đô"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Số Điện Thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="02435141791"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@chieuphimquocgia.com.vn"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô Tả</label>
                                <textarea
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Thông tin giới thiệu về cơ sở rạp..."
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded-xs border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Đang hoạt động
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Hủy Bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
                                >
                                    {isEditing ? 'Lưu Thay Đổi' : 'Tạo Cơ Sở Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Room Management */}
            {selectedTheaterForRooms && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <DoorClosed className="w-6 h-6 text-indigo-600" />
                                    Quản Lý Phòng Chiếu
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Cơ sở: <span className="font-semibold text-gray-700">{selectedTheaterForRooms.name}</span></p>
                            </div>
                            <button onClick={() => setSelectedTheaterForRooms(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <RoomManagement
                                parentTheaterId={selectedTheaterForRooms.id}
                                parentTheaterName={selectedTheaterForRooms.name}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TheaterManagement;
