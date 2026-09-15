import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';

export const PaymentPanel = ({
    reservationData,
    timeLeft = 0,
    isExpired = false,
    isProcessingPayment = false,
    onPay = () => { }
}) => {
    const navigate = useNavigate();
    const [isAgreed, setIsAgreed] = useState(false);

    if (!reservationData) return null;

    const {
        ticketSubtotal = 0,
        fnbSubtotal = 0,
        totalAmount = 0
    } = reservationData;

    const formatCountdown = (seconds) => {
        if (seconds <= 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isExpiringSoon = timeLeft > 0 && timeLeft < 120;
    const itemsSubtotal = Number(ticketSubtotal || 0) + Number(fnbSubtotal || 0);

    return (
        <div className="space-y-6">

            {/* 1. Countdown Box (Pure text, no icon) */}
            <div className={`
                p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors
                ${isExpired
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : isExpiringSoon
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-white border-slate-200/80 text-slate-700 shadow-xs'
                }
            `}>
                <span className="font-medium">
                    {isExpired ? 'Đơn hàng đã hết hạn:' : 'Thời gian giữ chỗ còn lại:'}
                </span>
                <span className={`font-mono text-base font-bold tracking-wider ${isExpired || isExpiringSoon ? 'text-red-600' : 'text-amber-600'}`}>
                    {formatCountdown(timeLeft)}
                </span>
            </div>

            {/* 2. Phương thức thanh toán (No Icons) */}
            <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                    Phương thức thanh toán
                </h3>

                <div className="space-y-2">
                    {/* VNPAY Radio Choice */}
                    <div className="p-3.5 rounded-xl border border-red-600 bg-red-50/20 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <input
                                type="radio"
                                id="payment-vnpay"
                                name="paymentMethod"
                                checked
                                readOnly
                                className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500 cursor-pointer"
                            />
                            <label htmlFor="payment-vnpay" className="text-sm font-bold text-slate-900 cursor-pointer">
                                VNPAY
                            </label>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                            QR Code, ATM, Quốc tế
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. Khuyến mãi Section (No Icons) */}
            <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                    Khuyến mãi
                </h3>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs text-xs">
                    {/* Voucher row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">Mã giảm giá</span>
                            <span className="text-slate-500 text-[11px]">Chưa áp dụng mã nào</span>
                        </div>
                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                        >
                            Chọn voucher
                        </button>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Point row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">Đổi điểm tích luỹ</span>
                            <span className="text-slate-500 text-[11px]">Hiện có 0 điểm</span>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200"
                        >
                            Đổi điểm
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Chi phí Section (No Icons) */}
            <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                    Chi phí
                </h3>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xs text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-slate-700">
                        <span>Thanh toán</span>
                        <span className="font-mono font-semibold text-slate-900">
                            {Number(itemsSubtotal || 0).toLocaleString('vi-VN')}đ
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                        <span>Phí</span>
                        <span className="font-mono text-slate-900">0đ</span>
                    </div>

                    <div className="flex justify-between items-center text-red-600">
                        <span>Giảm giá (voucher)</span>
                        <span className="font-mono font-semibold">0đ</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700">
                        <span>Đổi điểm</span>
                        <span className="font-mono text-slate-900">0đ</span>
                    </div>

                    <div className="border-t border-dashed border-slate-200 my-3" />

                    <div className="flex justify-between items-center text-sm sm:text-base font-bold text-slate-900">
                        <span>Tổng cộng</span>
                        <span className="font-mono font-extrabold text-red-600 text-lg sm:text-xl">
                            {Number(totalAmount || 0).toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                </div>
            </div>

            {/* 5. Checkbox Xác nhận Điều khoản */}
            <div className="flex items-start space-x-2.5 text-xs text-slate-600 pt-1">
                <input
                    type="checkbox"
                    id="agree-terms"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="agree-terms" className="cursor-pointer leading-relaxed text-xs text-slate-700">
                    Tôi xác nhận các thông tin đã chính xác và đồng ý với các{' '}
                    <Link
                        to={`${ROUTES.POLICY}?tab=terms`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 underline font-semibold hover:text-red-700"
                    >
                        điều khoản & chính sách
                    </Link>{' '}
                    của rạp
                </label>
            </div>

            {/* 6. Action Buttons (No Icons) */}
            <div className="space-y-3 pt-2">
                <button
                    type="button"
                    onClick={onPay}
                    disabled={isExpired || isProcessingPayment || !isAgreed}
                    className={`
                        w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition-all text-center
                        ${isExpired || !isAgreed
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                            : isProcessingPayment
                                ? 'bg-red-600 opacity-80 cursor-wait'
                                : 'bg-red-600 hover:bg-red-700 active:scale-[0.99] shadow-red-600/20 cursor-pointer'
                        }
                    `}
                >
                    {isProcessingPayment ? 'Đang chuyển sang VNPAY...' : 'Thanh toán'}
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1"
                    >
                        Quay lại
                    </button>
                </div>
            </div>

        </div>
    );
};

export default PaymentPanel;
