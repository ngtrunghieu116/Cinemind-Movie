import React, { useState, useEffect } from 'react';
import seatApi from '../api/seatApi';
import { Armchair, X, RefreshCw, Check, AlertCircle, Grid, Layers } from 'lucide-react';

const SeatManagementModal = ({ roomId, roomName, onClose }) => {
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Selection State
    const [selectedSeatIds, setSelectedSeatIds] = useState([]);

    // Batch Generate State
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [generateData, setGenerateData] = useState({
        startRow: 'A',
        endRow: 'F',
        seatsPerRow: 10,
        defaultSeatType: 'STANDARD',
        overrideExisting: false
    });

    useEffect(() => {
        if (roomId) {
            fetchSeats();
        }
    }, [roomId]);

    const fetchSeats = async () => {
        try {
            setLoading(true);
            const data = await seatApi.getByRoomId(roomId);
            setSeats(data || []);
            setSelectedSeatIds([]);
            setError(null);
            if (!data || data.length === 0) {
                setShowGenerateForm(true);
            }
        } catch (err) {
            setError('Không thể tải danh sách ghế: ' + (err.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLayout = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');
        try {
            await seatApi.generateLayout(roomId, generateData);
            setSuccessMessage('Khởi tạo sơ đồ ghế thành công!');
            setShowGenerateForm(false);
            fetchSeats();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể sinh sơ đồ ghế!');
        }
    };

    const handleSelectSeat = (seatId) => {
        if (selectedSeatIds.includes(seatId)) {
            setSelectedSeatIds(selectedSeatIds.filter(id => id !== seatId));
        } else {
            setSelectedSeatIds([...selectedSeatIds, seatId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedSeatIds.length === seats.length) {
            setSelectedSeatIds([]);
        } else {
            setSelectedSeatIds(seats.map(s => s.id));
        }
    };

    const handleBatchUpdate = async (seatType, isActive) => {
        if (selectedSeatIds.length === 0) return;
        setError(null);
        setSuccessMessage('');
        try {
            const payload = {
                seatIds: selectedSeatIds,
                seatType: seatType !== undefined ? seatType : undefined,
                isActive: isActive !== undefined ? isActive : undefined
            };
            await seatApi.batchUpdateSeats(payload);
            setSuccessMessage(`Đã cập nhật ${selectedSeatIds.length} ghế!`);
            fetchSeats();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể cập nhật danh sách ghế!');
        }
    };

    // Group seats by row
    const groupedSeats = seats.reduce((acc, seat) => {
        if (!acc[seat.rowName]) {
            acc[seat.rowName] = [];
        }
        acc[seat.rowName].push(seat);
        return acc;
    }, {});

    const getSeatColor = (type, isActive, isSelected) => {
        if (isSelected) {
            return 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold scale-105';
        }
        switch (type) {
            case 'STANDARD':
                return 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100';
            case 'VIP':
                return 'bg-amber-50 text-amber-900 border border-amber-400 font-semibold hover:bg-amber-100';
            case 'COUPLE':
                return 'bg-rose-50 text-rose-800 border border-rose-400 font-semibold hover:bg-rose-100';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-300';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Armchair className="w-6 h-6 text-blue-600" />
                            Quản Lý Sơ Đồ Ghế Ngồi
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Phòng chiếu: <span className="font-semibold text-gray-700">{roomName}</span> (Tổng số ghế: {seats.length})</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowGenerateForm(!showGenerateForm)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200"
                        >
                            <Grid size={15} /> {showGenerateForm ? 'Xem Sơ Đồ Ghế' : 'Sinh Sơ Đồ Tự Động'}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                            <Check size={16} /> {successMessage}
                        </div>
                    )}

                    {/* Form Generate Tự Động */}
                    {showGenerateForm ? (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-xl mx-auto space-y-4">
                            <div className="border-b border-gray-100 pb-3">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-blue-600" /> Cấu Hình Sinh Sơ Đồ Ghế Hàng Loạt
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ tự động tạo ma trận ghế từ hàng bắt đầu tới kết thúc.</p>
                            </div>

                            <form onSubmit={handleGenerateLayout} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Hàng Bắt Đầu</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={generateData.startRow}
                                            onChange={(e) => setGenerateData({ ...generateData, startRow: e.target.value.toUpperCase() })}
                                            placeholder="Ví dụ: A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Hàng Kết Thúc</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={generateData.endRow}
                                            onChange={(e) => setGenerateData({ ...generateData, endRow: e.target.value.toUpperCase() })}
                                            placeholder="Ví dụ: F"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Số Ghế Mỗi Hàng</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="30"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={generateData.seatsPerRow}
                                            onChange={(e) => setGenerateData({ ...generateData, seatsPerRow: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Loại Ghế Mặc Định</label>
                                        <select
                                            value={generateData.defaultSeatType}
                                            onChange={(e) => setGenerateData({ ...generateData, defaultSeatType: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="STANDARD">Ghế Thường (Standard)</option>
                                            <option value="VIP">Ghế VIP</option>
                                            <option value="COUPLE">Ghế Đôi (Couple)</option>
                                        </select>
                                    </div>
                                </div>

                                {seats.length > 0 && (
                                    <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-xs">
                                        <input
                                            type="checkbox"
                                            id="overrideExisting"
                                            checked={generateData.overrideExisting}
                                            onChange={(e) => setGenerateData({ ...generateData, overrideExisting: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded-xs border-gray-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="overrideExisting" className="font-semibold cursor-pointer">
                                            ⚠️ Ghi đè và xóa toàn bộ {seats.length} ghế hiện tại
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    {seats.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowGenerateForm(false)}
                                            className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            Hủy Bỏ
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        <RefreshCw size={14} /> Tự Động Sinh Sơ Đồ
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar Thao Tác Nhanh */}
                            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        onClick={handleSelectAll}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                                    >
                                        {selectedSeatIds.length === seats.length ? 'Bỏ Chọn Tất Cả' : 'Chọn Tất Cả'}
                                    </button>
                                    <span className="text-gray-500 font-medium">Đã chọn: <b className="text-blue-600">{selectedSeatIds.length}</b> ghế</span>
                                </div>

                                {selectedSeatIds.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-gray-400 font-medium">Đổi thành:</span>
                                        <button
                                            onClick={() => handleBatchUpdate('STANDARD')}
                                            className="px-2.5 py-1 bg-sky-100 text-sky-800 hover:bg-sky-200 text-xs font-semibold rounded border border-sky-300 transition-colors"
                                        >
                                            Ghế Thường
                                        </button>
                                        <button
                                            onClick={() => handleBatchUpdate('VIP')}
                                            className="px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold rounded border border-amber-300 transition-colors"
                                        >
                                            Ghế VIP
                                        </button>
                                        <button
                                            onClick={() => handleBatchUpdate('COUPLE')}
                                            className="px-2.5 py-1 bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-semibold rounded border border-rose-300 transition-colors"
                                        >
                                            Ghế Đôi
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Màn Hình Chiếu Preview */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs flex flex-col items-center space-y-6">
                                <div className="w-3/4 bg-gray-200 h-3 rounded-full shadow-inner flex items-center justify-center relative">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 absolute -top-5">Màn Hình Chiếu</span>
                                </div>

                                {/* Ma Trận Ghế */}
                                {loading ? (
                                    <div className="py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : Object.keys(groupedSeats).length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-sm">
                                        Phòng chiếu chưa có ghế nào. Vui lòng bấm "Sinh Sơ Đồ Tự Động".
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 w-full overflow-x-auto pb-4">
                                        {Object.keys(groupedSeats).sort().map(rowName => (
                                            <div key={rowName} className="flex items-center justify-center gap-2">
                                                <span className="w-6 font-bold text-sm text-gray-600 text-right shrink-0">{rowName}</span>
                                                <div className="flex items-center gap-2">
                                                    {groupedSeats[rowName].map(seat => {
                                                        const isSelected = selectedSeatIds.includes(seat.id);
                                                        return (
                                                            <button
                                                                key={seat.id}
                                                                onClick={() => handleSelectSeat(seat.id)}
                                                                title={`Hàng ${seat.rowName} - Ghế ${seat.seatNumber} (${seat.seatType})`}
                                                                className={`w-9 h-9 rounded-lg text-xs flex flex-col items-center justify-center transition-all shadow-2xs shrink-0 ${getSeatColor(seat.seatType, seat.isActive, isSelected)}`}
                                                            >
                                                                <span className="leading-none">{seat.seatNumber}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <span className="w-6 font-bold text-sm text-gray-600 text-left shrink-0">{rowName}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Legend Chú Thích */}
                                <div className="flex flex-wrap justify-center items-center gap-4 text-xs pt-4 border-t border-gray-100 w-full">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 bg-sky-50 border border-sky-300 rounded"></span>
                                        <span className="text-gray-600 font-medium">Ghế Thường</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 bg-amber-50 border border-amber-400 rounded"></span>
                                        <span className="text-gray-600 font-medium">Ghế VIP</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 bg-rose-50 border border-rose-400 rounded"></span>
                                        <span className="text-gray-600 font-medium">Ghế Đôi</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 bg-blue-600 rounded"></span>
                                        <span className="text-gray-600 font-medium">Đang Chọn</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeatManagementModal;
