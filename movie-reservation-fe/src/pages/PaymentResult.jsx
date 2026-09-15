import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, Film, Clock, Calendar, Ticket, Popcorn, ArrowRight, Home, RefreshCw, Loader2 } from 'lucide-react';
import { paymentApi } from '../api/paymentApi';
import ROUTES from '../constants/routes';

export const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [resultStatus, setResultStatus] = useState(null); // 'SUCCESS', 'CANCELLED', 'FAILED', 'ERROR'
    const [reviewData, setReviewData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const verifyPayment = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        const params = Object.fromEntries(searchParams.entries());
        const responseCode = params.vnp_ResponseCode;

        // Must have query params to verify
        if (!params.vnp_TxnRef || !params.vnp_SecureHash) {
            setResultStatus('ERROR');
            setErrorMessage('Không tìm thấy thông tin giao dịch thanh toán.');
            setIsLoading(false);
            return;
        }

        try {
            const data = await paymentApi.getVnPayReturn(params);
            setReviewData(data);

            if (responseCode === '24' || data?.status === 'CANCELLED') {
                setResultStatus('CANCELLED');
            } else if (responseCode === '00' && data?.status === 'CONFIRMED') {
                setResultStatus('SUCCESS');
            } else {
                setResultStatus('FAILED');
                setErrorMessage(`Giao dịch chưa được xác nhận bởi hệ thống vé. Trạng thái đơn hàng: ${data?.status || 'N/A'}`);
            }
        } catch (err) {
            console.error('Failed to verify VNPAY return:', err);
            if (responseCode === '24') {
                setResultStatus('CANCELLED');
            } else {
                setResultStatus('FAILED');
                setErrorMessage(err.message || 'Xác thực chữ ký hoặc trạng thái đơn hàng thất bại.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        verifyPayment();
    }, [verifyPayment]);

    const formatDateTime = (isoString) => {
        if (!isoString) return { time: '--:--', date: '--/--/----' };
        const d = new Date(isoString);
        return {
            time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            date: d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
        };
    };

    return (
        <div className="min-h-screen bg-[#0B0F14] text-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E50914] selection:text-white flex items-center justify-center">
            
            {/* Loading State */}
            {isLoading && (
                <div className="max-w-md w-full bg-[#121821] border border-[#2A323E] rounded-3xl p-10 text-center space-y-4 shadow-2xl">
                    <Loader2 className="w-12 h-12 animate-spin text-[#E50914] mx-auto" />
                    <h2 className="text-lg font-bold text-white">Đang Xác Thực Thanh Toán...</h2>
                    <p className="text-xs text-[#94A3B8]">Vui lòng không đóng trình duyệt trong khi hệ thống xác nhận giao dịch với VNPAY.</p>
                </div>
            )}

            {/* Result States */}
            {!isLoading && (
                <div className="max-w-2xl w-full space-y-6">
                    
                    {/* SUCCESS STATE */}
                    {resultStatus === 'SUCCESS' && (
                        <div className="bg-[#121821] border border-[#10B981]/40 rounded-3xl p-6 sm:p-10 space-y-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] text-center animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center mx-auto text-[#10B981]">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-widest text-[#10B981] font-bold">Giao Dịch Thành Công</span>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Đặt Vé Hoàn Tất!</h1>
                                <p className="text-xs sm:text-sm text-[#94A3B8]">
                                    Cảm ơn bạn đã lựa chọn Cinemind. Mã giữ chỗ của bạn là{' '}
                                    <strong className="text-[#F59E0B] font-mono font-bold">#{reviewData?.bookingCode || '---'}</strong>
                                </p>
                            </div>

                            {/* Ticket Summary Card */}
                            {reviewData && (
                                <div className="bg-[#171C24] border border-[#252C38] rounded-2xl p-5 sm:p-6 text-left space-y-4">
                                    <div className="flex items-center space-x-3 border-b border-[#252C38] pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center flex-shrink-0 text-[#E50914]">
                                            <Film className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white">{reviewData.movieTitle}</h3>
                                            <div className="flex items-center space-x-3 text-xs text-[#94A3B8] mt-0.5">
                                                <span className="flex items-center space-x-1">
                                                    <Clock className="w-3.5 h-3.5 text-[#E50914]" />
                                                    <strong className="text-white font-mono">{formatDateTime(reviewData.showtimeStart).time}</strong>
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center space-x-1 capitalize">
                                                    <Calendar className="w-3.5 h-3.5 text-[#E50914]" />
                                                    <span>{formatDateTime(reviewData.showtimeStart).date}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seat Chips */}
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center space-x-1">
                                            <Ticket className="w-3.5 h-3.5 text-[#3B82F6]" />
                                            <span>Ghế ({reviewData.ticketSeats?.length || 0}):</span>
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(reviewData.ticketSeats || []).map((s, idx) => (
                                                <span key={idx} className="px-2.5 py-1 rounded-md bg-[#1E293B] border border-[#3B82F6]/30 text-[#60A5FA] font-mono text-xs font-bold">
                                                    {s.rowName}{s.seatNumber}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* F&B Items */}
                                    {reviewData.items?.length > 0 && (
                                        <div className="space-y-1.5 pt-2 border-t border-[#252C38]">
                                            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center space-x-1">
                                                <Popcorn className="w-3.5 h-3.5 text-[#F59E0B]" />
                                                <span>Bắp nước:</span>
                                            </span>
                                            <div className="text-xs text-[#CBD5E1] space-y-1">
                                                {reviewData.items.map((it, idx) => (
                                                    <div key={idx} className="flex justify-between">
                                                        <span>{it.productName} × {it.quantity}</span>
                                                        <span className="font-mono text-[#F59E0B]">{Number(it.subtotal || 0).toLocaleString('vi-VN')} đ</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Paid */}
                                    <div className="pt-3 border-t border-[#252C38] flex items-center justify-between">
                                        <span className="text-xs text-[#94A3B8] font-bold uppercase">Tổng đã thanh toán:</span>
                                        <span className="text-xl font-black font-mono text-[#10B981]">
                                            {Number(reviewData.totalAmount || 0).toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <Link
                                    to={ROUTES.MY_BOOKINGS}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#F5222D] text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-[#E50914]/25 flex items-center justify-center space-x-2"
                                >
                                    <span>Xem Lịch Sử Đặt Vé</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to={ROUTES.HOME}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#171C24] hover:bg-[#252B34] text-[#CBD5E1] hover:text-white border border-[#2A323E] text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Về Trang Chủ</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* CANCELLED STATE */}
                    {resultStatus === 'CANCELLED' && (
                        <div className="bg-[#121821] border border-[#F59E0B]/40 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center mx-auto text-[#F59E0B]">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-widest text-[#F59E0B] font-bold">Giao Dịch Đã Hủy</span>
                                <h1 className="text-2xl sm:text-3xl font-black text-white">Đơn hàng đã bị hủy</h1>
                                <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto">
                                    Quá trình thanh toán trên VNPAY đã bị hủy. Ghế giữ chỗ của bạn có thể đã được giải phóng cho khán giả khác.
                                </p>
                            </div>
                            <div className="pt-2 flex justify-center">
                                <Link
                                    to={ROUTES.HOME}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#E50914] hover:bg-[#F5222D] text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-[#E50914]/25"
                                >
                                    Về Trang Chủ
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* FAILED OR ERROR STATE */}
                    {(resultStatus === 'FAILED' || resultStatus === 'ERROR') && (
                        <div className="bg-[#121821] border border-[#EF4444]/40 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center mx-auto text-[#EF4444]">
                                <XCircle className="w-10 h-10" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs uppercase tracking-widest text-[#EF4444] font-bold">Thanh Toán Thất Bại</span>
                                <h1 className="text-2xl sm:text-3xl font-black text-white">Giao Dịch Không Thành Công</h1>
                                <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto">
                                    {errorMessage || 'Đã có lỗi xảy ra trong quá trình xử lý thanh toán qua VNPAY. Vui lòng kiểm tra lại tài khoản hoặc thử lại.'}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={verifyPayment}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1A222D] hover:bg-[#252E3D] text-white border border-[#2A323E] text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Kiểm Tra Lại</span>
                                </button>
                                <Link
                                    to={ROUTES.MOVIES}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#F5222D] text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-[#E50914]/25"
                                >
                                    Xem Phim Khác
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PaymentResult;
