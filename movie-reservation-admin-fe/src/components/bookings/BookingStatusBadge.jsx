import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Ticket } from 'lucide-react';

const BookingStatusBadge = ({ status, type = 'booking' }) => {
    if (!status) return null;

    // 1. Trạng thái Đặt vé (Booking Status)
    if (type === 'booking') {
        switch (status) {
            case 'CONFIRMED':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        Đã xác nhận
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock size={13} className="text-amber-600" />
                        Chờ thanh toán
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                        <XCircle size={13} className="text-rose-600" />
                        Đã hủy
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center whitespace-nowrap bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                        {status}
                    </span>
                );
        }
    }

    // 2. Trạng thái Thanh toán (Payment Status)
    if (type === 'payment') {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        Thành công
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock size={13} className="text-amber-600" />
                        Đang chờ
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                        <XCircle size={13} className="text-rose-600" />
                        Thất bại
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center whitespace-nowrap bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                        {status}
                    </span>
                );
        }
    }

    // 3. Trạng thái Vé điện tử (Ticket Status)
    if (type === 'ticket') {
        switch (status) {
            case 'CHECKED_IN':
            case 'USED':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200">
                        <CheckCircle2 size={13} className="text-purple-600" />
                        Đã check-in
                    </span>
                );
            case 'ISSUED':
            case 'VALID':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
                        <Ticket size={13} className="text-blue-600" />
                        Chưa check-in
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-rose-50 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-rose-200">
                        <XCircle size={13} className="text-rose-600" />
                        Vé đã hủy
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center whitespace-nowrap bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200">
                        {status}
                    </span>
                );
        }
    }

    return null;
};

export default BookingStatusBadge;
