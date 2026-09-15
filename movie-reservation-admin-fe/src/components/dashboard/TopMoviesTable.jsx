import React from 'react';

const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v));

/**
 * TopMoviesTable — Bảng Top phim theo doanh thu
 * Props:
 *   data    (array) — TopMovieStatResponse[]
 *   loading (boolean)
 */
const TopMoviesTable = ({ data = [], loading = false }) => {
    return (
        <div className="stat-table-card">
            <div className="stat-table-card__header">
                <h3 className="stat-table-card__title">Top Phim theo Doanh thu</h3>
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
                                <th>#</th>
                                <th>Tên Phim</th>
                                <th className="text-right">Vé Bán</th>
                                <th className="text-right">Đặt Vé</th>
                                <th className="text-right">Doanh Thu</th>
                                <th className="text-right">Tỷ Lệ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((movie, idx) => (
                                <tr key={movie.movieId}>
                                    <td className="stat-table__rank">{idx + 1}</td>
                                    <td className="stat-table__movie-title">{movie.movieTitle}</td>
                                    <td className="text-right">{Number(movie.ticketsSold).toLocaleString('vi-VN')}</td>
                                    <td className="text-right">{Number(movie.bookingCount).toLocaleString('vi-VN')}</td>
                                    <td className="text-right stat-table__revenue">{fmtVND(movie.revenue)}</td>
                                    <td className="text-right">
                                        <span className="stat-table__badge">
                                            {movie.revenuePercentage?.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TopMoviesTable;
