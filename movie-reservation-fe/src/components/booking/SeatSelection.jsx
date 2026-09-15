import { useMemo } from 'react';
import { Lock } from 'lucide-react';

const VietnamStar = ({ className }) => (
    <svg viewBox="0 0 900 600" className={className} style={{ width: '22px', height: '15px' }}>
        <polygon points="450,120 546,425 285,236 615,236 354,425" fill="#FBBF24" />
    </svg>
);

export const SeatSelection = ({
    seats = [],
    selectedSeats = [],
    onToggleSeat = () => {},
    roomName = 'Phòng chiếu số 11'
}) => {
    // Nhóm ghế theo từng hàng (rowName: A, B, C...)
    const rows = useMemo(() => {
        if (!seats || seats.length === 0) return {};
        const grouped = {};
        seats.forEach((seat) => {
            const row = seat.rowName || 'A';
            if (!grouped[row]) {
                grouped[row] = [];
            }
            grouped[row].push(seat);
        });

        // Sắp xếp các hàng theo thứ tự alphabet và ghế trong hàng theo seatNumber
        const sortedRows = {};
        Object.keys(grouped)
            .sort()
            .forEach((rowKey) => {
                sortedRows[rowKey] = grouped[rowKey].sort(
                    (a, b) => a.seatNumber - b.seatNumber
                );
            });

        return sortedRows;
    }, [seats]);

    // Kiểm tra trạng thái của một ghế
    const getSeatState = (seat) => {
        const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);

        if (isSelected) {
            return {
                style: 'bg-blue-600 border-blue-700 text-white font-bold shadow-md shadow-blue-500/20 scale-105 cursor-pointer',
                isClickable: true,
                icon: null,
                tooltip: `${seat.rowName}${seat.seatNumber} (Ghế bạn chọn - ${(seat.price || 0).toLocaleString('vi-VN')} đ)`
            };
        }

        if (seat.status === 'SOLD') {
            return {
                style: 'bg-red-700 border-red-800 opacity-90 cursor-not-allowed text-white',
                isClickable: false,
                icon: <VietnamStar className="w-5 h-5 absolute inset-0 m-auto" />,
                tooltip: `${seat.rowName}${seat.seatNumber} (Đã bán)`
            };
        }

        if (seat.status === 'HELD') {
            return {
                style: 'bg-slate-300 border-dashed border-slate-400 text-slate-500 cursor-not-allowed opacity-75',
                isClickable: false,
                icon: <Lock className="w-3 h-3 text-slate-600 absolute inset-0 m-auto" />,
                tooltip: `${seat.rowName}${seat.seatNumber} (Đang có người giữ chỗ)`
            };
        }

        // Trạng thái AVAILABLE
        if (seat.seatType === 'VIP') {
            return {
                style: 'bg-amber-400 border-amber-500 text-slate-900 font-bold hover:bg-amber-500 hover:shadow-xs cursor-pointer transition-all hover:scale-105',
                isClickable: true,
                icon: null,
                tooltip: `${seat.rowName}${seat.seatNumber} (VIP - ${(seat.price || 0).toLocaleString('vi-VN')} đ)`
            };
        }

        if (seat.seatType === 'COUPLE') {
            return {
                style: 'bg-rose-500 border-rose-600 text-white font-bold hover:bg-rose-600 hover:shadow-xs cursor-pointer transition-all hover:scale-105 min-w-[3.5rem]',
                isClickable: true,
                icon: null,
                tooltip: `${seat.rowName}${seat.seatNumber} (Đôi - ${(seat.price || 0).toLocaleString('vi-VN')} đ)`
            };
        }

        // Standard
        return {
            style: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400 cursor-pointer transition-all hover:scale-105 shadow-xs',
            isClickable: true,
            icon: null,
            tooltip: `${seat.rowName}${seat.seatNumber} (Thường - ${(seat.price || 0).toLocaleString('vi-VN')} đ)`
        };
    };

    return (
        <div className="w-full flex flex-col items-center py-6 font-sans">
            
            {/* 1. CINEMA SCREEN */}
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center mb-8 px-4">
                <div className="w-full relative flex flex-col items-center">
                    {/* Perspective Trapezoid Screen */}
                    <div 
                        className="w-full h-12 relative shadow-[0_15px_30px_rgba(245,158,11,0.2)]"
                        style={{
                            background: 'linear-gradient(180deg, #F59E0B 0%, rgba(245, 158, 11, 0.3) 60%, transparent 100%)',
                            clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)',
                            borderRadius: '4px'
                        }}
                    />
                    {/* Perspective Glow Effect */}
                    <div className="w-4/5 h-2 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 blur-xs -mt-1" />
                </div>

                {/* Room Name Label */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-widest mt-4 uppercase">
                    {roomName || 'Phòng chiếu'}
                </h3>
            </div>

            {/* 2. SEAT MAP GRID */}
            <div className="w-full overflow-x-auto pb-6 scrollbar-none">
                <div className="min-w-fit mx-auto flex flex-col items-center space-y-2.5 px-4">
                    {Object.entries(rows).map(([rowKey, rowSeats]) => (
                        <div key={rowKey} className="flex items-center space-x-2.5">
                            {/* Row Label Left */}
                            <span className="w-5 text-right text-xs font-bold text-slate-500">
                                {rowKey}
                            </span>

                            {/* Seats in Row */}
                            <div className="flex space-x-2">
                                {rowSeats.map((seat) => {
                                    const { style, isClickable, icon, tooltip } = getSeatState(seat);
                                    const sizeClass = seat.seatType === 'COUPLE' ? 'w-12 h-7 sm:h-8' : 'w-7 h-7 sm:w-8 sm:h-8';

                                    return (
                                        <button
                                            key={seat.seatId}
                                            type="button"
                                            title={tooltip}
                                            disabled={!isClickable}
                                            onClick={() => onToggleSeat(seat)}
                                            className={`
                                                ${sizeClass} rounded-md border text-[10px] sm:text-xs flex items-center justify-center relative select-none font-semibold
                                                ${style}
                                            `}
                                        >
                                            {!icon && <span>{seat.rowName}{seat.seatNumber}</span>}
                                            {icon}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Row Label Right */}
                            <span className="w-5 text-left text-xs font-bold text-slate-500">
                                {rowKey}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. SEAT LEGEND */}
            <div className="mt-4 pt-6 border-t border-slate-200/80 w-full max-w-3xl flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-xs text-slate-700 font-medium">
                <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded bg-red-700 border border-red-800 flex items-center justify-center relative overflow-hidden">
                        <VietnamStar className="absolute" />
                    </span>
                    <span>Đã đặt</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded bg-blue-600 border border-blue-700 shadow-xs" />
                    <span>Ghế bạn chọn</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
                    <span>Ghế thường</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded bg-amber-400 border border-amber-500" />
                    <span>Ghế VIP</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-5 h-4 rounded bg-rose-500 border border-rose-600" />
                    <span>Ghế đôi</span>
                </div>
            </div>
        </div>
    );
};

export default SeatSelection;
