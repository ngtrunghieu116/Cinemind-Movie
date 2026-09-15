import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
    X,
    Film,
    User,
    Calendar,
    Clock,
    Building2,
    Ticket,
    Coffee,
    CreditCard,
    CheckCircle2,
    QrCode,
    AlertCircle,
    Copy,
    Check
} from 'lucide-react';
import bookingAdminApi from '../../api/bookingAdminApi';
import BookingStatusBadge from './BookingStatusBadge';
import CheckInConfirmModal from './CheckInConfirmModal';

const BookingDetailDrawer = ({ isOpen, bookingId, onClose, onCheckInUpdated }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check-in modal state
    const [checkInModalOpen, setCheckInModalOpen] = useState(false);
    const [selectedTicketForCheckIn, setSelectedTicketForCheckIn] = useState(null);
    const [checkInLoading, setCheckInLoading] = useState(false);

    // Copy state
    const [copiedCode, setCopiedCode] = useState(null);

    const fetchDetail = useCallback(async (id) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await bookingAdminApi.getBookingDetail(id);
            setDetail(data);
        } catch (err) {
            console.error('Error fetching booking detail:', err);
            setError(err.response?.data?.message || 'Không thể tải thông tin chi tiết đơn đặt vé.');
            toast.error('Lỗi khi tải chi tiết đơn hàng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && bookingId) {
            fetchDetail(bookingId);
        } else {
            setDetail(null);
            setError(null);
        }
    }, [isOpen, bookingId, fetchDetail]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !checkInModalOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, checkInModalOpen, onClose]);

    const handleCopy = (text, type = 'bookingCode') => {
        navigator.clipboard.writeText(text);
        setCopiedCode(type);
        toast.success(`Đã sao chép: ${text}`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleOpenCheckInModal = (ticket) => {
        setSelectedTicketForCheckIn(ticket);
        setCheckInModalOpen(true);
    };

    const handleConfirmCheckIn = async (ticketCode) => {
        setCheckInLoading(true);
        try {
            await bookingAdminApi.checkInTicket(ticketCode);
            toast.success(`Check-in vé ${ticketCode} thành công!`);
            setCheckInModalOpen(false);
            setSelectedTicketForCheckIn(null);

            // Refresh booking detail cục bộ
            await fetchDetail(bookingId);
            if (onCheckInUpdated) {
                onCheckInUpdated();
            }
        } catch (err) {
            console.error('Check-in error:', err);
            const msg = err.response?.data?.message || 'Check-in vé thất bại.';
            toast.error(msg);
        } finally {
            setCheckInLoading(false);
        }
    };

    if (!isOpen) return null;

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

    return (
        <div className="fixed inset-0 z-40 overflow-hidden bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
            {/* Click outside backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
                    {/* Header */}
                    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
                                <Ticket size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Chi Tiết Đơn Đặt Vé</h2>
                                <p className="text-xs text-slate-400">
                                    Mã đơn: <span className="font-mono text-white font-semibold">{detail?.bookingCode || 'Đang tải...'}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Đóng (ESC)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        {loading && (
                            <div className="space-y-4 animate-pulse py-8">
                                <div className="h-20 bg-slate-200 rounded-xl"></div>
                                <div className="h-32 bg-slate-200 rounded-xl"></div>
                                <div className="h-40 bg-slate-200 rounded-xl"></div>
                                <div className="h-32 bg-slate-200 rounded-xl"></div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <div>
                                    <p className="font-bold">Lỗi tải dữ liệu</p>
                                    <p className="text-xs text-rose-600">{error}</p>
                                </div>
                            </div>
                        )}

                        {!loading && !error && detail && (
                            <>
                                {/* SECTION 1: BOOKING HEADER & STATUSES */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-medium">Mã đặt vé:</span>
                                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-sm flex items-center gap-1.5">
                                                {detail.bookingCode}
                                                <button
                                                    onClick={() => handleCopy(detail.bookingCode, 'bookingCode')}
                                                    className="text-slate-400 hover:text-slate-700 transition-colors"
                                                    title="Sao chép mã đặt vé"
                                                >
                                                    {copiedCode === 'bookingCode' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                </button>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookingStatusBadge status={detail.bookingStatus} type="booking" />
                                            <BookingStatusBadge status={detail.paymentStatus} type="payment" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <span className="text-slate-400 block font-medium">Ngày đặt:</span>
                                            <span className="text-slate-700 font-semibold">{formatDate(detail.createdAt)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block font-medium">Hết hạn giữ chỗ:</span>
                                            <span className="text-slate-700 font-semibold">{formatDate(detail.expiresAt)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block font-medium">Tổng thanh toán:</span>
                                            <span className="text-red-600 font-bold text-sm">{formatCurrency(detail.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: CUSTOMER INFORMATION */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <User size={15} className="text-slate-600" />
                                        Thông Tin Khách Hàng
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                        <div>
                                            <span className="text-xs text-slate-400 block">Họ và tên:</span>
                                            <span className="font-semibold text-slate-800">{detail.customerName || 'Khách vãng lai'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 block">Email:</span>
                                            <span className="font-semibold text-slate-800 truncate block">{detail.customerEmail || 'Chưa cung cấp'}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 block">Số điện thoại:</span>
                                            <span className="font-semibold text-slate-800">{detail.customerPhone || 'Chưa cung cấp'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: MOVIE & SHOWTIME */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Film size={15} className="text-slate-600" />
                                        Phim & Suất Chiếu
                                    </h3>
                                    <div className="flex gap-4 items-start">
                                        <img
                                            src={detail.posterPath || '/placeholder-poster.png'}
                                            alt={detail.movieTitle}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&fit=crop&q=80';
                                            }}
                                            className="w-20 h-28 object-cover rounded-xl shadow-xs border border-slate-200 shrink-0"
                                        />
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-base font-bold text-slate-900 leading-snug">
                                                    {detail.movieTitle}
                                                </h4>
                                                {detail.ageRating && (
                                                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-200">
                                                        {detail.ageRating}
                                                    </span>
                                                )}
                                                {detail.roomType && (
                                                    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                                        {detail.roomType}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={14} className="text-slate-400 shrink-0" />
                                                    <span>{detail.theaterName} — <strong>{detail.roomName}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                                    <span>{formatDate(detail.showtimeStart, 'dd/MM/yyyy')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-slate-400 shrink-0" />
                                                    <span>
                                                        {formatDate(detail.showtimeStart, 'HH:mm')} - {formatDate(detail.showtimeEnd, 'HH:mm')}
                                                    </span>
                                                </div>
                                                {(detail.language || detail.subtitle) && (
                                                    <div className="text-slate-500">
                                                        {detail.language} {detail.subtitle ? `• ${detail.subtitle}` : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: SEATS & PRICING */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Ticket size={15} className="text-slate-600" />
                                            Ghế Đã Đặt ({detail.ticketCount || detail.seatNames?.length || 0} vé)
                                        </h3>
                                        <span className="text-sm font-bold text-slate-800">
                                            Tạm tính vé: {formatCurrency(detail.ticketSubtotal)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {detail.seatNames && detail.seatNames.length > 0 ? (
                                            detail.seatNames.map((seat, idx) => (
                                                <span
                                                    key={idx}
                                                    className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200/80 shadow-2xs"
                                                >
                                                    Ghế {seat}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Chưa có thông tin ghế</span>
                                        )}
                                    </div>
                                </div>

                                {/* SECTION 5: F&B ITEMS */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Coffee size={15} className="text-slate-600" />
                                            Bắp & Nước (F&B)
                                        </h3>
                                        {detail.fnbSubtotal > 0 && (
                                            <span className="text-sm font-bold text-slate-800">
                                                Tạm tính F&B: {formatCurrency(detail.fnbSubtotal)}
                                            </span>
                                        )}
                                    </div>
                                    {detail.fnbItems && detail.fnbItems.length > 0 ? (
                                        <div className="divide-y divide-slate-100 bg-slate-50/70 rounded-xl p-3 border border-slate-100 text-xs">
                                            {detail.fnbItems.map((item, idx) => (
                                                <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                                                    <div>
                                                        <span className="font-semibold text-slate-800">{item.productName}</span>
                                                        <span className="text-slate-400 ml-2">× {item.quantity}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-700">{formatCurrency(item.subtotal)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                            Đơn hàng không có sản phẩm bắp nước F&B.
                                        </p>
                                    )}
                                </div>

                                {/* SECTION 6: PAYMENT INFO */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <CreditCard size={15} className="text-slate-600" />
                                        Thông Tin Thanh Toán
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                                        <div>
                                            <span className="text-slate-400 block">Phương thức:</span>
                                            <span className="font-bold text-slate-800">{detail.paymentMethod || 'VNPAY'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Ngân hàng:</span>
                                            <span className="font-semibold text-slate-800">{detail.bankCode || 'VNPAY QR'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Mã GD VNPAY:</span>
                                            <span className="font-mono font-semibold text-slate-800">{detail.transactionNo || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Mã tham chiếu (TxnRef):</span>
                                            <span className="font-mono font-semibold text-slate-800">{detail.transactionRef || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Thời gian thanh toán:</span>
                                            <span className="font-semibold text-slate-800">{formatDate(detail.paidAt)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Số tiền thanh toán:</span>
                                            <span className="font-bold text-emerald-600 text-sm">{formatCurrency(detail.amount || detail.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 7: ELECTRONIC TICKETS & QR CODE */}
                                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <QrCode size={15} className="text-slate-600" />
                                            Danh Sách Vé Điện Tử & Check-In ({detail.tickets?.length || 0})
                                        </h3>
                                    </div>

                                    {detail.tickets && detail.tickets.length > 0 ? (
                                        <div className="space-y-4">
                                            {detail.tickets.map((tkt, idx) => {
                                                const isIssued = tkt.status === 'ISSUED' || tkt.status === 'VALID';
                                                const isCheckedIn = tkt.status === 'CHECKED_IN' || tkt.status === 'USED';
                                                const isCancelled = tkt.status === 'CANCELLED';

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${isCheckedIn
                                                            ? 'bg-purple-50/40 border-purple-200'
                                                            : isCancelled
                                                                ? 'bg-rose-50/40 border-rose-200 opacity-70'
                                                                : 'bg-white border-slate-200 shadow-xs'
                                                            }`}
                                                    >
                                                        {/* Ticket Info */}
                                                        <div className="space-y-1.5 text-xs flex-1 w-full sm:w-auto">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-mono font-bold text-slate-800 text-sm">{tkt.ticketCode}</span>
                                                                <BookingStatusBadge status={tkt.status} type="ticket" />
                                                            </div>
                                                            <div className="text-slate-600 flex items-center gap-3">
                                                                <span>Ghế: <strong className="text-red-600">{tkt.seatName}</strong></span>
                                                                <span>Giá: <strong>{formatCurrency(tkt.price)}</strong></span>
                                                            </div>
                                                            {isCheckedIn && tkt.checkedInAt && (
                                                                <p className="text-[11px] text-purple-700 font-medium">
                                                                    Check-in lúc: {formatDate(tkt.checkedInAt)}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* QR Code */}
                                                        {tkt.qrCodeUrl && (
                                                            <div className="shrink-0 p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                                                                <img
                                                                    src={tkt.qrCodeUrl}
                                                                    alt={`QR Code ${tkt.ticketCode}`}
                                                                    className="w-18 h-18 object-contain"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Check-In Action Button */}
                                                        <div className="shrink-0 w-full sm:w-auto text-right">
                                                            {isIssued && (
                                                                <button
                                                                    onClick={() => handleOpenCheckInModal(tkt)}
                                                                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                                                >
                                                                    <CheckCircle2 size={15} />
                                                                    Check-In
                                                                </button>
                                                            )}
                                                            {isCheckedIn && (
                                                                <span className="inline-flex items-center gap-1 text-xs text-purple-700 font-bold bg-purple-100/80 px-3 py-1.5 rounded-xl border border-purple-200">
                                                                    <CheckCircle2 size={14} />
                                                                    Đã Check-In
                                                                </span>
                                                            )}
                                                            {isCancelled && (
                                                                <span className="text-xs text-slate-400 font-medium italic">
                                                                    Không khả dụng
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            Chưa có vé điện tử được phát hành cho đơn đặt vé này.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Check-In Confirm Modal */}
            <CheckInConfirmModal
                isOpen={checkInModalOpen}
                ticket={selectedTicketForCheckIn}
                loading={checkInLoading}
                onConfirm={handleConfirmCheckIn}
                onClose={() => {
                    if (!checkInLoading) {
                        setCheckInModalOpen(false);
                        setSelectedTicketForCheckIn(null);
                    }
                }}
            />
        </div>
    );
};

export default BookingDetailDrawer;
