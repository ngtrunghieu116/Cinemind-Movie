import React, { useState, useEffect } from 'react';
import roomApi from '../api/roomApi';
import theaterApi from '../api/theaterApi';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash2, DoorClosed, Filter, Building2, X, Armchair } from 'lucide-react';
import SeatManagementModal from './SeatManagementModal';

const RoomManagement = ({ parentTheaterId, parentTheaterName }) => {
    const [rooms, setRooms] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [theaterFilter, setTheaterFilter] = useState('');
    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedRoomForSeats, setSelectedRoomForSeats] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        roomType: 'TWO_D',
        theaterId: parentTheaterId || '',
        isActive: true
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchTheaters();
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [pageNo, pageSize, search, theaterFilter]);

    const fetchTheaters = async () => {
        try {
            const data = await theaterApi.getAll();
            const list = Array.isArray(data) ? data : (data.content || []);
            setTheaters(list);
            if (list.length > 0 && !formData.theaterId && !parentTheaterId) {
                setFormData(prev => ({ ...prev, theaterId: list[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch theaters:', err);
        }
    };

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const params = {
                page: pageNo,
                size: pageSize
            };
            if (parentTheaterId) params.theaterId = parentTheaterId;
            else if (theaterFilter) params.theaterId = theaterFilter;
            if (search.trim()) params.search = search.trim();

            const data = await roomApi.getAll(params);

            if (data && data.content !== undefined) {
                setRooms(data.content);
                setTotalElements(data.totalElements);
                setTotalPages(data.totalPages);
            } else {
                setRooms(data);
                setTotalElements(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách phòng chiếu. ' + (err.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (room = null) => {
        setFormError('');
        if (room) {
            setIsEditing(true);
            setEditingId(room.id);
            setFormData({
                name: room.name || '',
                roomType: room.roomType || 'TWO_D',
                theaterId: room.theaterId || parentTheaterId || (theaters[0]?.id || ''),
                isActive: room.isActive !== undefined ? room.isActive : true
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                name: '',
                roomType: 'TWO_D',
                theaterId: parentTheaterId || theaters[0]?.id || '',
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

        if (!formData.name.trim() || !formData.theaterId) {
            setFormError('Vui lòng nhập tên phòng và chọn rạp trực thuộc!');
            return;
        }

        try {
            if (isEditing) {
                await roomApi.update(editingId, formData);
            } else {
                await roomApi.create(formData);
            }
            fetchRooms();
            handleCloseModal();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Không thể lưu thông tin phòng chiếu!');
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa phòng chiếu "${name}"?`)) {
            try {
                await roomApi.delete(id);
                fetchRooms();
            } catch (err) {
                alert('Không thể xóa phòng chiếu: ' + (err.response?.data?.message || ''));
            }
        }
    };

    const getRoomTypeBadge = (type) => {
        switch (type) {
            case 'TWO_D':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded border border-blue-200">2D</span>;
            case 'THREE_D':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded border border-purple-200">3D</span>;
            case 'FOUR_DX':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded border border-red-200">4DX</span>;
            case 'IMAX':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded border border-amber-300">IMAX</span>;
            case 'VIP_ROOM':
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded border border-emerald-200">VIP</span>;
            default:
                return <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded">{type}</span>;
        }
    };

    return (
        <div className={parentTheaterId ? "space-y-4" : "space-y-6"}>
            {/* Header */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white ${parentTheaterId ? '' : 'p-6 rounded-xl shadow-sm border border-gray-100'}`}>
                <div>
                    {!parentTheaterId && (
                        <>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <DoorClosed className="w-7 h-7 text-blue-600" /> Quản Lý Phòng Chiếu Phim
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Danh sách phòng chiếu, loại phòng (2D/3D/IMAX) theo từng cơ sở rạp</p>
                        </>
                    )}
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                    <Plus size={18} /> Thêm Phòng Mới
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên phòng..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPageNo(0);
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                </div>

                {!parentTheaterId && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Filter className="text-gray-400 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-600">Cơ sở Rạp:</span>
                        <select
                            value={theaterFilter}
                            onChange={(e) => {
                                setTheaterFilter(e.target.value);
                                setPageNo(0);
                            }}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="">Tất cả rạp/cơ sở</option>
                            {theaters.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className={`bg-white ${parentTheaterId ? 'rounded-lg border border-gray-200' : 'rounded-xl shadow-sm border border-gray-100'} overflow-hidden`}>
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
                                        <th className="px-6 py-4">Tên Phòng Chiếu</th>
                                        <th className="px-6 py-4">Loại Phòng</th>
                                        <th className="px-6 py-4">Cơ Sở Rạp Trực Thuộc</th>
                                        <th className="px-6 py-4">Trạng Thái</th>
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {rooms.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-gray-400">
                                                Không tìm thấy phòng chiếu nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        rooms.map((r) => (
                                            <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-gray-500">{r.id}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{r.name}</td>
                                                <td className="px-6 py-4">{getRoomTypeBadge(r.roomType)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded-full text-xs border border-blue-100">
                                                        <Building2 size={13} />
                                                        {r.theaterName || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {r.isActive ? (
                                                        <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                                                            Hoạt động
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center whitespace-nowrap shrink-0 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                                                            Tạm dừng
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedRoomForSeats(r)}
                                                            className="text-amber-600 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                                                            title="Sơ đồ ghế"
                                                        >
                                                            <Armchair size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenModal(r)}
                                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                                            title="Sửa phòng"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(r.id, r.name)}
                                                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Xóa phòng"
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isEditing ? 'Cập Nhật Phòng Chiếu' : 'Thêm Phòng Chiếu Mới'}
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
                                    Cơ Sở Rạp Trực Thuộc <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.theaterId}
                                    disabled={!!parentTheaterId}
                                    onChange={(e) => setFormData({ ...formData, theaterId: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">-- Chọn Rạp Chiếu --</option>
                                    {theaters.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Tên Phòng Chiếu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ví dụ: Phòng 01, Phòng IMAX 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Loại Phòng Chiếu <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.roomType}
                                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="TWO_D">Phòng 2D</option>
                                    <option value="THREE_D">Phòng 3D</option>
                                    <option value="FOUR_DX">Phòng 4DX</option>
                                    <option value="IMAX">Phòng IMAX</option>
                                    <option value="VIP_ROOM">Phòng VIP</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isRoomActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded-xs border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="isRoomActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Sẵn sàng hoạt động
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
                                    {isEditing ? 'Lưu Thay Đổi' : 'Tạo Phòng Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Quản Lý Sơ Đồ Ghế */}
            {selectedRoomForSeats && (
                <SeatManagementModal
                    roomId={selectedRoomForSeats.id}
                    roomName={selectedRoomForSeats.name}
                    onClose={() => setSelectedRoomForSeats(null)}
                />
            )}
        </div>
    );
};

export default RoomManagement;
