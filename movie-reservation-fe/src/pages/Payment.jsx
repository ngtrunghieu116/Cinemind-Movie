import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reservationApi } from '../api/reservationApi';
import { paymentApi } from '../api/paymentApi';
import { OrderSummary } from '../components/payment/OrderSummary';
import { PaymentPanel } from '../components/payment/PaymentPanel';
import ROUTES from '../constants/routes';
import toast from 'react-hot-toast';

export const Payment = () => {
    const { reservationId } = useParams();
    const navigate = useNavigate();

    const [reservationData, setReservationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [isExpired, setIsExpired] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const timerRef = useRef(null);

    // 1. Fetch Reservation Review
    const fetchReservationReview = useCallback(async () => {
        if (!reservationId) {
            setIsError(true);
            setErrorMessage('Không tìm thấy mã đơn đặt vé.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setErrorMessage('');

        try {
            const data = await reservationApi.reviewReservation(reservationId);
            setReservationData(data);

            // If already confirmed, redirect to My Bookings / Profile
            if (data.status === 'CONFIRMED') {
                toast.success('Đơn hàng này đã được thanh toán thành công.');
                navigate('/profile?tab=bookings');
                return;
            }

            // If cancelled, mark as expired/cancelled
            if (data.status === 'CANCELLED') {
                setIsExpired(true);
            }

            // Compute initial timeLeft
            if (data.expiresAt) {
                const diffSeconds = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
                setTimeLeft(diffSeconds);
                if (diffSeconds <= 0) {
                    setIsExpired(true);
                }
            }
        } catch (err) {
            console.error('Failed to load reservation review:', err);
            const status = err.status || err.statusCode;
            setIsError(true);
            if (status === 404) {
                setErrorMessage('Đơn đặt vé không tồn tại hoặc đã bị hủy.');
            } else if (status === 403) {
                setErrorMessage('Bạn không có quyền xem đơn đặt vé của người dùng khác.');
            } else if (status === 401) {
                setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate(ROUTES.LOGIN);
            } else {
                setErrorMessage(err.message || 'Không thể tải thông tin đơn đặt vé.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [reservationId, navigate]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchReservationReview();
    }, [fetchReservationReview]);

    // 2. Countdown Timer Loop
    useEffect(() => {
        if (!reservationData?.expiresAt) return;

        const checkCountdown = () => {
            const targetTime = new Date(reservationData.expiresAt).getTime();
            const diffSeconds = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
            setTimeLeft(diffSeconds);

            if (diffSeconds <= 0) {
                setIsExpired(true);
                if (timerRef.current) clearInterval(timerRef.current);
                toast.error('Thời gian giữ chỗ đã hết hạn. Vui lòng đặt vé lại.', { id: 'payment-expired' });
            }
        };

        checkCountdown();
        timerRef.current = setInterval(checkCountdown, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [reservationData]);

    // 3. Handle VNPAY Payment Creation
    const handlePay = async () => {
        if (isExpired || isProcessingPayment) return;

        setIsProcessingPayment(true);
        try {
            const response = await paymentApi.createPayment(reservationId);
            if (response?.paymentUrl) {
                toast.success('Đang chuyển hướng sang cổng thanh toán VNPAY...');
                window.location.href = response.paymentUrl;
            } else {
                toast.error('Không nhận được liên kết thanh toán từ VNPAY.');
                setIsProcessingPayment(false);
            }
        } catch (err) {
            console.error('Payment creation failed:', err);
            const status = err.status || err.statusCode;
            if (status === 400 || status === 409) {
                toast.error(err.message || 'Đơn hàng không thể thanh toán hoặc đã hết hạn.');
                setIsExpired(true);
            } else {
                toast.error(err.message || 'Khởi tạo thanh toán VNPAY thất bại. Vui lòng thử lại.');
            }
            setIsProcessingPayment(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
            
            {/* Top Navigation / Breadcrumbs (No Icons) */}
            <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Quay lại
                    </button>

                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Link to={ROUTES.HOME} className="hover:text-slate-900 transition-colors">Trang chủ</Link>
                        <span className="text-slate-300">/</span>
                        <span>Đặt vé</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-red-600 font-bold">Thanh toán</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                        <p className="text-slate-500 text-sm font-medium">Đang tải thông tin thanh toán...</p>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && isError && (
                    <div className="max-w-lg mx-auto bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
                        <h3 className="text-lg font-bold text-slate-900">Lỗi Đơn Đặt Vé</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            {errorMessage}
                        </p>
                        <div className="flex items-center justify-center space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={fetchReservationReview}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                            >
                                Thử lại
                            </button>
                            <Link
                                to={ROUTES.MOVIES}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/20"
                            >
                                Xem phim khác
                            </Link>
                        </div>
                    </div>
                )}

                {/* 2-Column Checkout Layout */}
                {!isLoading && !isError && reservationData && (
                    <div className="space-y-6">
                        
                        {/* Movie Header Title */}
                        <div className="border-b border-slate-200/80 pb-4">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
                                {reservationData.movieTitle || 'Xác Nhận & Thanh Toán'}
                            </h1>
                        </div>

                        {/* 2 Columns: OrderSummary (Left) & PaymentPanel (Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                            
                            {/* LEFT COLUMN: Order Summary */}
                            <div className="lg:col-span-7 xl:col-span-8">
                                <OrderSummary reservationData={reservationData} />
                            </div>

                            {/* RIGHT COLUMN: Payment Panel */}
                            <div className="lg:col-span-5 xl:col-span-4">
                                <PaymentPanel
                                    reservationData={reservationData}
                                    timeLeft={timeLeft}
                                    isExpired={isExpired}
                                    isProcessingPayment={isProcessingPayment}
                                    onPay={handlePay}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;
