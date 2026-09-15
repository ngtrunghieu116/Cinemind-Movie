import React from 'react';
import { Search, Filter, Calendar, RotateCcw } from 'lucide-react';

const BookingFilters = ({
    searchTerm,
    onSearchChange,
    bookingStatus,
    onBookingStatusChange,
    paymentStatus,
    onPaymentStatusChange,
    showtimeDate,
    onShowtimeDateChange,
    onResetFilters
}) => {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm mã đặt vé, tên khách hàng, email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                    {/* Booking Status Filter */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={bookingStatus}
                            onChange={(e) => onBookingStatusChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                        >
                            <option value="">Tất cả trạng thái đặt vé</option>
                            <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                            <option value="PENDING">Chờ xử lý (PENDING)</option>
                            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                        </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={paymentStatus}
                            onChange={(e) => onPaymentStatusChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                        >
                            <option value="">Tất cả thanh toán</option>
                            <option value="COMPLETED">Thành công (COMPLETED)</option>
                            <option value="PENDING">Chờ thanh toán (PENDING)</option>
                            <option value="FAILED">Thất bại (FAILED)</option>
                        </select>
                    </div>

                    {/* Showtime Date Filter */}
                    <div className="w-full sm:w-auto relative">
                        <input
                            type="date"
                            value={showtimeDate}
                            onChange={(e) => onShowtimeDateChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                            title="Lọc theo ngày suất chiếu"
                        />
                    </div>

                    {/* Reset Button */}
                    {(searchTerm || bookingStatus || paymentStatus || showtimeDate) && (
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="shrink-0 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Đặt lại bộ lọc"
                        >
                            <RotateCcw size={15} />
                            <span className="hidden sm:inline">Đặt lại</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingFilters;
