import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import showtimeApi from '../api/showtimeApi';
import crawlerApi from '../api/crawlerApi';
import theaterApi from '../api/theaterApi';
import roomApi from '../api/roomApi';
import movieApi from '../api/movieApi';
import Pagination from '../components/Pagination';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Film,
  Building2,
  X,
  Filter,
  Ticket,
  DollarSign,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const ShowtimeManagement = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);

  // Filters
  const [filterTheater, setFilterTheater] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterMovie, setFilterMovie] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    movieId: '',
    theaterId: '',
    roomId: '',
    startTime: '',
    priceStandard: '',
    priceVip: '',
    priceCouple: ''
  });

  const [modalRooms, setModalRooms] = useState([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchShowtimes();
  }, [filterTheater, filterRoom, filterMovie, filterDate, page, pageSize]);

  // When filter theater changes, fetch rooms for filter
  useEffect(() => {
    setFilterRoom('');
    if (filterTheater) {
      fetchRoomsByTheater(filterTheater, setRooms);
    } else {
      setRooms([]);
    }
  }, [filterTheater]);

  // When modal theater changes, fetch rooms for modal
  useEffect(() => {
    if (formData.theaterId) {
      fetchRoomsByTheater(formData.theaterId, setModalRooms);
    } else {
      setModalRooms([]);
    }
  }, [formData.theaterId]);

  // Auto-fill prices when room changes
  useEffect(() => {
    if (formData.roomId && !editingShowtime) {
      const selectedRoom = modalRooms.find(r => r.id === parseInt(formData.roomId));
      if (selectedRoom) {
        let defaultPrices = { standard: 80000, vip: 100000, couple: 150000 };
        if (selectedRoom.roomType === '3D') {
          defaultPrices = { standard: 100000, vip: 120000, couple: 180000 };
        } else if (selectedRoom.roomType === 'IMAX') {
          defaultPrices = { standard: 120000, vip: 150000, couple: 220000 };
        } else if (selectedRoom.roomType === 'VIP') {
          defaultPrices = { standard: 150000, vip: 180000, couple: 250000 };
        }

        setFormData(prev => ({
          ...prev,
          priceStandard: defaultPrices.standard,
          priceVip: defaultPrices.vip,
          priceCouple: defaultPrices.couple
        }));
      }
    }
  }, [formData.roomId, modalRooms, editingShowtime]);

  const loadInitialData = async () => {
    setFetchError(false);
    try {
      await Promise.all([fetchTheaters(), fetchMovies()]);
    } catch (err) {
      setFetchError(true);
      toast.error('Lỗi khi tải dữ liệu ban đầu. Vui lòng thử lại.');
    }
  };

  const fetchTheaters = async () => {
    const res = await theaterApi.getAll();
    setTheaters(Array.isArray(res) ? res : res.content || []);
  };

  const fetchRoomsByTheater = async (theaterId, setRoomsState) => {
    try {
      const params = theaterId ? { theaterId } : {};
      const res = await roomApi.getAll(params);
      setRoomsState(Array.isArray(res) ? res : res.content || []);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách phòng chiếu');
    }
  };

  const fetchMovies = async () => {
    const res = await movieApi.getAll();
    setMovies(Array.isArray(res) ? res : res.content || []);
  };

  const fetchShowtimes = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = { page, size: pageSize };
      if (filterTheater) params.theaterId = filterTheater;
      if (filterRoom) params.roomId = filterRoom;
      if (filterMovie) params.movieId = filterMovie;
      if (filterDate) {
        params.fromDate = `${filterDate}T00:00:00`;
        params.toDate = `${filterDate}T23:59:59`;
      }

      const res = await showtimeApi.searchShowtimes(params);
      setShowtimes(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setFetchError(true);
      toast.error('Lỗi khi tải danh sách suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (showtime = null) => {
    setEditingShowtime(showtime);
    if (showtime) {
      setFormData({
        movieId: showtime.movieId,
        theaterId: showtime.theaterId,
        roomId: showtime.roomId,
        startTime: showtime.startTime.substring(0, 16),
        priceStandard: showtime.priceStandard,
        priceVip: showtime.priceVip,
        priceCouple: showtime.priceCouple
      });
    } else {
      setFormData({
        movieId: '',
        theaterId: filterTheater || (theaters.length > 0 ? theaters[0].id : ''),
        roomId: filterRoom || '',
        startTime: '',
        priceStandard: '',
        priceVip: '',
        priceCouple: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShowtime(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        movieId: Number(formData.movieId),
        roomId: Number(formData.roomId),
        startTime: formData.startTime.length === 16 ? `${formData.startTime}:00` : formData.startTime,
        priceStandard: Number(formData.priceStandard),
        priceVip: Number(formData.priceVip),
        priceCouple: Number(formData.priceCouple)
      };

      if (editingShowtime) {
        await showtimeApi.updateShowtime(editingShowtime.id, payload);
        toast.success('Cập nhật suất chiếu thành công!');
      } else {
        await showtimeApi.createShowtime(payload);
        toast.success('Tạo suất chiếu thành công!');
      }
      handleCloseModal();
      fetchShowtimes();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa suất chiếu này?')) return;
    try {
      await showtimeApi.deleteShowtime(id);
      toast.success('Xóa suất chiếu thành công!');
      fetchShowtimes();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Không thể xóa suất chiếu này');
      }
    }
  };

  const handleClearFilters = () => {
    setFilterTheater('');
    setFilterRoom('');
    setFilterMovie('');
    setFilterDate('');
    setPage(0);
  };

  const handleCrawlShowtimes = async () => {
    try {
      setCrawling(true);
      toast.loading('Đang cào suất chiếu thực tế từ NCC qua Python Crawler...', { id: 'crawl-showtimes' });
      const res = await crawlerApi.crawlShowtimes();
      toast.success(
        `Crawl hoàn tất: ${res.inserted || 0} suất mới, ${res.updated || 0} cập nhật!`,
        { id: 'crawl-showtimes', duration: 4000 }
      );
      fetchShowtimes();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi crawl suất chiếu từ Python service!', { id: 'crawl-showtimes' });
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Quản Lý Lịch Chiếu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý lịch chiếu phim, thời gian chiếu và giá vé theo từng cơ sở rạp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCrawlShowtimes}
            disabled={crawling}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RotateCcw size={18} className={crawling ? "animate-spin" : ""} />
            {crawling ? 'Đang cào...' : 'Crawl Suất Chiếu NCC'}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} /> Thêm Suất Chiếu
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider w-full mb-1">
          <Filter size={14} /> Bộ Lọc Tìm Kiếm
        </div>

        {/* Filter Theater */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Cơ sở Rạp
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            value={filterTheater}
            onChange={(e) => {
              setFilterTheater(e.target.value);
              setPage(0);
            }}
          >
            <option value="">-- Tất cả cơ sở --</option>
            {theaters.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Room */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Phòng chiếu
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
            value={filterRoom}
            onChange={(e) => {
              setFilterRoom(e.target.value);
              setPage(0);
            }}
            disabled={!filterTheater}
          >
            <option value="">-- Tất cả phòng --</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.roomType})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Movie */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Phim Chiếu
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            value={filterMovie}
            onChange={(e) => {
              setFilterMovie(e.target.value);
              setPage(0);
            }}
          >
            <option value="">-- Tất cả phim --</option>
            {movies.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        {/* Filter Date */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Ngày chiếu
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setPage(0);
            }}
          />
        </div>

        {/* Clear Filters */}
        {(filterTheater || filterRoom || filterMovie || filterDate) && (
          <button
            onClick={handleClearFilters}
            className="px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phim
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cơ Sở / Phòng
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Thời Gian Chiếu
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Giá Vé (STD / VIP / ĐÔI)
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng Thái & Ghế
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Đang tải danh sách suất chiếu...
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <p className="text-red-500 font-medium mb-2">Không thể lấy dữ liệu suất chiếu</p>
                    <button
                      onClick={fetchShowtimes}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all font-medium text-xs"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : showtimes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-10 h-10 text-gray-300 stroke-1" />
                      <p className="text-sm font-medium">Không tìm thấy suất chiếu nào phù hợp</p>
                    </div>
                  </td>
                </tr>
              ) : (
                showtimes.map((st) => (
                  <tr key={st.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-6 py-4 font-semibold text-gray-400 text-xs">
                      #{st.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{st.movieTitle}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {st.movieDuration} phút
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 text-xs flex items-center gap-1">
                        <Building2 size={13} className="text-gray-400" /> {st.theaterName}
                      </div>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          {st.roomName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-blue-600 flex items-center gap-1">
                        <Calendar size={13} /> {format(new Date(st.startTime), 'HH:mm - dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Kết thúc: {format(new Date(st.endTime), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Thường:</span>
                        <span className="font-semibold text-gray-900">{st.priceStandard?.toLocaleString()}đ</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-600 font-medium">VIP:</span>
                        <span className="font-semibold text-amber-700">{st.priceVip?.toLocaleString()}đ</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-rose-600 font-medium">Đôi:</span>
                        <span className="font-semibold text-rose-700">{st.priceCouple?.toLocaleString()}đ</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            st.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : st.status === 'SOLD_OUT'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {st.status === 'AVAILABLE'
                            ? '● Còn chỗ'
                            : st.status === 'SOLD_OUT'
                            ? '● Hết vé'
                            : '● Đã chiếu'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5">
                        Trống: <strong className="text-gray-800">{st.availableSeats}</strong> / {st.availableSeats + st.bookedSeats} ghế
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(st)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Xóa"
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

        {/* Standardized Pagination Component */}
        <Pagination
          pageNo={page}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
        />
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600" />
                {editingShowtime ? 'Cập Nhật Suất Chiếu' : 'Thêm Suất Chiếu Mới'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Select Movie */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phim Chiếu <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="movieId"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    value={formData.movieId}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn phim --</option>
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>

                {/* Select Theater */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cơ sở Rạp <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="theaterId"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    value={formData.theaterId}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn cơ sở --</option>
                    {theaters.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Room */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phòng chiếu <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="roomId"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    value={formData.roomId}
                    onChange={handleChange}
                    disabled={!formData.theaterId}
                  >
                    <option value="">-- Chọn phòng --</option>
                    {modalRooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.roomType})</option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Giờ kết thúc sẽ được hệ thống tự động tính dựa trên thời lượng phim.
                  </p>
                </div>

                {/* Prices */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Giá vé Thường (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="priceStandard"
                    required
                    min="0"
                    step="1000"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.priceStandard}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Giá vé VIP (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="priceVip"
                    required
                    min="0"
                    step="1000"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.priceVip}
                    onChange={handleChange}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Giá vé Đôi / Couple (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="priceCouple"
                    required
                    min="0"
                    step="1000"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.priceCouple}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Edit Warning Note */}
              {editingShowtime && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-lg flex items-start gap-2.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Lưu ý quan trọng:</strong> Nếu suất chiếu này đã có khách đặt vé, hệ thống chỉ cho phép cập nhật Giá vé. Phim, Phòng chiếu và Giờ chiếu sẽ không thể thay đổi.
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {editingShowtime ? 'Cập Nhật' : 'Thêm Suất Chiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowtimeManagement;
