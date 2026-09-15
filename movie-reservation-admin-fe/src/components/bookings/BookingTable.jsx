import React from 'react';
import { format } from 'date-fns';
import { Eye, Ticket, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';

const BookingTable = ({ bookings, loading, error, onSelectBooking, onRetry }) => {
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (dateStr, formatPattern = 'dd/MM/yyyy HH:mm') => {
        if (!dateStr) return 'N/A';
        try {
            return format(new Date(dateStr), formatPattern);
        } catch {
            return dateStr;
        }
    };

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-xs border border-rose-100 p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-800">Không thể tải danh sách đơn đặt vé</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">{error}</p>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                        <RefreshCw size={15} />
                        Thử lại
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-5 py-3.5">Mã Đặt Vé</th>
                            <th className="px-5 py-3.5">Khách Hàng</th>
                            <th className="px-5 py-3.5">Phim</th>
                            <th className="px-5 py-3.5">Suất Chiếu</th>
                            <th className="px-5 py-3.5">Ghế Đặt</th>
                            <th className="px-5 py-3.5 text-right">Tổng Tiền</th>
                            <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                            <th className="px-5 py-3.5 text-center">Thanh Toán</th>
                            <th className="px-5 py-3.5">Ngày Đặt</th>
                            <th className="px-5 py-3.5 text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            // Skeleton loading rows
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="animate-pulse">
                                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-32 mb-1"></div><div className="h-3 bg-gray-100 rounded w-20"></div></td>
                                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-36"></div></td>
                                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-28 mb-1"></div><div className="h-3 bg-gray-100 rounded w-16"></div></td>
                                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-5 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                    <td className="px-5 py-4 text-center"><div className="h-5 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                                    <td className="px-5 py-4 text-center"><div className="h-5 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-5 py-4 text-right"><div className="h-8 bg-gray-200 rounded-lg w-16 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : bookings.length === 0 ? (
                            // Empty State
                            <tr>
                                <td colSpan="10" className="px-6 py-16 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                                            <Ticket size={28} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-base font-bold text-gray-700">Không tìm thấy giao dịch nào</p>
                                            <p className="text-xs text-gray-400 max-w-sm">
                                                Không có đơn đặt vé nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            // Data Rows
                            bookings.map((booking) => (
                                <tr
                                    key={booking.reservationId}
                                    onClick={() => onSelectBooking(booking.reservationId)}
                                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                >
                                    {/* Mã Đặt Vé */}
                                    <td className="px-5 py-4">
                                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 group-hover:bg-red-50 group-hover:text-red-700 px-2 py-1 rounded-md transition-colors">
                                            {booking.bookingCode}
                                        </span>
                                    </td>

                                    {/* Khách Hàng */}
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-gray-900 leading-snug">
                                            {booking.customerName || 'Khách vãng lai'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {booking.customerPhone || booking.customerEmail || '—'}
                                        </div>
                                    </td>

                                    {/* Phim */}
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-gray-900 max-w-xs truncate" title={booking.movieTitle}>
                                            {booking.movieTitle}
                                        </div>
                                    </td>

                                    {/* Suất Chiếu */}
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-800 text-xs">
                                            {formatDate(booking.showtimeStart, 'dd/MM/yyyy HH:mm')}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {booking.roomName}
                                        </div>
                                    </td>

                                    {/* Ghế Đặt */}
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                                            {booking.seatNames && booking.seatNames.length > 0 ? (
                                                booking.seatNames.slice(0, 3).map((seat, idx) => (
                                                    <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-1.5 py-0.5 rounded">
                                                        {seat}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">0 vé</span>
                                            )}
                                            {booking.seatNames && booking.seatNames.length > 3 && (
                                                <span className="text-[11px] text-gray-500 font-semibold bg-gray-100 px-1 py-0.5 rounded">
                                                    +{booking.seatNames.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Tổng Tiền */}
                                    <td className="px-5 py-4 text-right whitespace-nowrap font-bold text-red-600">
                                        {formatCurrency(booking.totalAmount)}
                                    </td>

                                    {/* Trạng Thái Đặt Vé */}
                                    <td className="px-5 py-4 text-center whitespace-nowrap">
                                        <BookingStatusBadge status={booking.bookingStatus} type="booking" />
                                    </td>

                                    {/* Trạng Thái Thanh Toán */}
                                    <td className="px-5 py-4 text-center whitespace-nowrap">
                                        <BookingStatusBadge status={booking.paymentStatus} type="payment" />
                                    </td>

                                    {/* Ngày Đặt */}
                                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {formatDate(booking.createdAt, 'dd/MM/yyyy HH:mm')}
                                    </td>

                                    {/* Thao Tác */}
                                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onSelectBooking(booking.reservationId)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <Eye size={14} />
                                            <span>Chi tiết</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingTable;
