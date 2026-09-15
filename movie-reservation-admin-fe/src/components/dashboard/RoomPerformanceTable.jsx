import React from 'react';

const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v));

const roomTypeLabel = (t) => {
    const map = { STANDARD: 'Thường', VIP: 'VIP', IMAX: 'IMAX', '4DX': '4DX' };
    return map[t] || t || '—';
};

/**
 * RoomPerformanceTable — Bảng hiệu suất phòng chiếu
 * Props:
 *   data    (array) — RoomPerformanceStatResponse[]
 *   loading (boolean)
 */
const RoomPerformanceTable = ({ data = [], loading = false }) => {
    return (
        <div className="stat-table-card">
            <div className="stat-table-card__header">
                <h3 className="stat-table-card__title">Hiệu Suất Phòng Chiếu</h3>
            </div>

            <div className="stat-table-card__body">
                {loading ? (
                    <div className="stat-table-card__skeleton" />
                ) : data.length === 0 ? (
                    <p className="stat-table-card__empty">Chưa có dữ liệu</p>
                ) : (
                    <table className="stat-table">
                        <thead>
                            <tr>
                                <th>Phòng Chiếu</th>
                                <th>Loại</th>
                                <th className="text-right">Suất Chiếu</th>
                                <th className="text-right">Vé Bán</th>
                                <th className="text-right">Doanh Thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((room) => (
                                <tr key={room.roomId}>
                                    <td className="stat-table__movie-title">{room.roomName}</td>
                                    <td>
                                        <span className="stat-table__type-badge">
                                            {roomTypeLabel(room.roomType)}
                                        </span>
                                    </td>
                                    <td className="text-right">{Number(room.showtimesCount).toLocaleString('vi-VN')}</td>
                                    <td className="text-right">{Number(room.ticketsSold).toLocaleString('vi-VN')}</td>
                                    <td className="text-right stat-table__revenue">{fmtVND(room.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default RoomPerformanceTable;
