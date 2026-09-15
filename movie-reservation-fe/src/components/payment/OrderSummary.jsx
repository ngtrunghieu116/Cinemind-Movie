export const OrderSummary = ({ reservationData }) => {
    if (!reservationData) return null;

    const {
        showtimeStart,
        roomName,
        ticketSeats = [],
        ticketSubtotal = 0,
        items = [],
        fnbSubtotal = 0
    } = reservationData;

    const startDate = showtimeStart ? new Date(showtimeStart) : null;
    const formattedTime = startDate
        ? startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '--:--';
    const formattedDate = startDate
        ? startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '--/--/----';

    const seatsText = ticketSeats.length > 0
        ? ticketSeats.map(s => `${s.rowName}${s.seatNumber}`).join(', ')
        : 'Chưa chọn';

    return (
        <div className="space-y-6">
            
            {/* 1. Top Card: Quick Showtime & Seat Information (No Icons) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    {/* Top Left: Showtime */}
                    <div>
                        <span className="text-slate-500 block text-xs mb-1">Ngày giờ chiếu</span>
                        <span className="font-bold text-slate-900 font-mono text-base sm:text-lg">
                            {formattedTime} - {formattedDate}
                        </span>
                    </div>

                    {/* Top Right: Seats */}
                    <div>
                        <span className="text-slate-500 block text-xs mb-1">Ghế</span>
                        <span className="font-bold text-slate-900 font-mono text-base sm:text-lg">
                            {seatsText}
                        </span>
                    </div>

                    {/* Bottom Left: Format */}
                    <div>
                        <span className="text-slate-500 block text-xs mb-1">Định dạng</span>
                        <span className="font-bold text-slate-900 text-sm">
                            2D
                        </span>
                    </div>

                    {/* Bottom Right: Room */}
                    <div>
                        <span className="text-slate-500 block text-xs mb-1">Phòng chiếu</span>
                        <span className="font-bold text-slate-900 text-sm">
                            {roomName || '11'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Main Section: Thông tin thanh toán Table (No Icons) */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Thông tin thanh toán
                </h2>

                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-semibold">
                            <tr>
                                <th className="py-3.5 px-4 sm:px-6 w-[55%]">Danh mục</th>
                                <th className="py-3.5 px-4 text-center w-[20%]">Số lượng</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right w-[25%]">Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {/* Row 1: Movie Tickets / Seats */}
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 sm:px-6 font-medium">
                                    Ghế ({seatsText})
                                </td>
                                <td className="py-4 px-4 text-center font-mono font-semibold">
                                    {ticketSeats.length}
                                </td>
                                <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-slate-900">
                                    {Number(ticketSubtotal || 0).toLocaleString('vi-VN')}đ
                                </td>
                            </tr>

                            {/* Additional Rows: FnB Combos / Bắp nước */}
                            {items && items.length > 0 && items.map((item, idx) => (
                                <tr key={item.itemId || item.productId || idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4 sm:px-6 font-medium">
                                        {item.name || item.productName || 'Combo bắp nước'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-mono font-semibold">
                                        {item.quantity}
                                    </td>
                                    <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-slate-900">
                                        {Number(item.subtotal || 0).toLocaleString('vi-VN')}đ
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default OrderSummary;
