import { useState } from 'react';
import { ChevronUp, ChevronDown, Ticket, Popcorn } from 'lucide-react';

export const BookingSummary = ({
    selectedSeats = [],
    isHolding = false,
    isReleasing = false,
    // Multi-step flow props
    currentStep = 1,
    reservationData = null,
    isCreatingReservation = false,
    onContinue = () => {},
    onBack = () => {}
}) => {
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    // Totals from Backend Reservation or Local Seats
    const ticketTotal = reservationData
        ? Number(reservationData.ticketSubtotal || 0)
        : selectedSeats.reduce((sum, seat) => sum + (Number(seat.price) || 0), 0);

    const fnbTotal = reservationData ? Number(reservationData.fnbSubtotal || 0) : 0;
    const grandTotal = reservationData ? Number(reservationData.totalAmount || 0) : ticketTotal;

    // Seats & Items
    const displaySeats = reservationData?.ticketSeats || selectedSeats;
    const seatsText = displaySeats.length > 0
        ? displaySeats.map(s => `${s.rowName}${s.seatNumber}`).join(', ')
        : 'Chưa chọn';

    const fnbItems = reservationData?.items || [];
    const fnbCount = fnbItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const fnbText = fnbItems.length > 0
        ? fnbItems.map(i => `${i.productName || 'Combo'} × ${i.quantity}`).join(', ')
        : 'Chưa chọn';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
            
            {/* Expandable Order Detail Drawer (Pop-up above the bar - Light Mode) */}
            {isDetailsExpanded && (
                <div className="bg-white border-t border-x border-slate-200/80 max-w-7xl mx-auto rounded-t-2xl shadow-2xl p-5 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 space-y-4 text-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                            <span>Chi Tiết Đơn Đặt Vé</span>
                            {reservationData?.bookingCode && (
                                <span className="text-xs text-slate-500 font-mono font-normal">
                                    (Mã: #{reservationData.bookingCode})
                                </span>
                            )}
                        </h4>
                        <button
                            type="button"
                            onClick={() => setIsDetailsExpanded(false)}
                            className="text-xs text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                        >
                            <span>Thu gọn</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Left Column: Tickets & Seats */}
                        <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                            <div className="flex items-center justify-between text-slate-700 font-semibold">
                                <span className="flex items-center space-x-1.5 text-blue-600">
                                    <Ticket className="w-4 h-4" />
                                    <span>Ghế đã chọn ({displaySeats.length}):</span>
                                </span>
                                <span className="font-mono text-slate-900 font-bold">{ticketTotal.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <p className="text-slate-600 font-mono text-[11px] leading-relaxed">
                                {seatsText}
                            </p>
                        </div>

                        {/* Right Column: F&B Combos */}
                        <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                            <div className="flex items-center justify-between text-slate-700 font-semibold">
                                <span className="flex items-center space-x-1.5 text-amber-600">
                                    <Popcorn className="w-4 h-4" />
                                    <span>Bắp nước ({fnbCount} phần):</span>
                                </span>
                                <span className="font-mono text-slate-900 font-bold">{fnbTotal.toLocaleString('vi-VN')} đ</span>
                            </div>
                            {fnbItems.length > 0 ? (
                                <div className="space-y-1">
                                    {fnbItems.map(item => (
                                        <div key={item.itemId || item.productId} className="flex justify-between text-[11px] text-slate-500">
                                            <span>{item.productName} × {item.quantity}</span>
                                            <span className="font-mono text-slate-900">{Number(item.subtotal || 0).toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-[11px] italic">Chưa chọn bắp nước (không bắt buộc)</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Bottom Action Bar (Light Mode) */}
            <div className="bg-white border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
                <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
                    
                    {/* LEFT: Order Info Summary */}
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-slate-700">
                            {/* Seat snippet */}
                            <div className="flex items-center">
                                <span className="text-slate-500 mr-1">Ghế:</span>
                                <span className="font-bold text-blue-600 truncate max-w-[100px] sm:max-w-[180px]" title={seatsText}>
                                    {seatsText}
                                </span>
                            </div>

                            {/* F&B snippet */}
                            {currentStep >= 2 && (
                                <>
                                    <span className="text-slate-300">|</span>
                                    <div className="flex items-center">
                                        <span className="text-slate-500 mr-1">Bắp nước:</span>
                                        <span className={`font-semibold truncate max-w-[120px] sm:max-w-[200px] ${fnbCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} title={fnbText}>
                                            {fnbCount > 0 ? `${fnbCount} phần` : '0'}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* Details Toggle Button */}
                            {currentStep >= 2 && (
                                <button
                                    type="button"
                                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                                    className="hidden sm:flex items-center space-x-0.5 text-xs text-slate-500 hover:text-slate-900 ml-2 py-0.5 px-2 rounded bg-slate-100 border border-slate-200 cursor-pointer"
                                >
                                    <span>{isDetailsExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                                    {isDetailsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                </button>
                            )}
                        </div>
                        
                        {/* Grand Total */}
                        <div className="flex items-center space-x-2">
                            <span className="text-slate-500 text-xs sm:text-sm font-medium">Tổng tiền:</span>
                            <span className="text-xl sm:text-2xl font-black font-mono text-red-600 tracking-tight">
                                {grandTotal.toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center space-x-2.5 sm:space-x-4">
                        {/* BACK BUTTON */}
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={isReleasing || isCreatingReservation || isHolding}
                            className="px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                            {isReleasing ? 'Đang hủy...' : 'Quay lại'}
                        </button>

                        {/* STEP 1: CONTINUE BUTTON */}
                        {currentStep === 1 && (
                            <button
                                type="button"
                                onClick={onContinue}
                                disabled={selectedSeats.length === 0 || isCreatingReservation || isHolding || isReleasing}
                                className={`
                                    px-5 sm:px-8 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md select-none
                                    ${selectedSeats.length === 0
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20 cursor-pointer'
                                    }
                                `}
                            >
                                {isCreatingReservation ? 'Đang xử lý...' : 'Tiếp tục'}
                            </button>
                        )}

                        {/* STEP 2: PROCEED TO PAYMENT PAGE */}
                        {currentStep === 2 && (
                            <button
                                type="button"
                                onClick={onContinue}
                                className="px-5 sm:px-8 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center space-x-1.5"
                            >
                                <span>Thanh toán</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
