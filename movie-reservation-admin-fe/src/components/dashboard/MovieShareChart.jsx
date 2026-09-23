import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

// CineMind color palette — đỏ chủ đạo, các màu phụ tối giản
const COLORS = [
    '#c0392b', // CineMind Red
    '#2c3e50', // Dark slate
    '#7f8c8d', // Gray
    '#bdc3c7', // Light gray
    '#95a5a6', // Mid gray
    '#d35400', // Burnt orange
    '#16a085', // Teal
    '#8e44ad', // Purple
    '#2980b9', // Blue
    '#f39c12', // Amber
];

const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip__date">{d.movieTitle}</p>
            <p className="chart-tooltip__row">
                <span>Doanh thu:</span>
                <strong>{fmtVND(d.revenue)}</strong>
            </p>
            <p className="chart-tooltip__row">
                <span>Tỷ lệ:</span>
                <strong>{d.revenuePercentage?.toFixed(1)}%</strong>
            </p>
        </div>
    );
};

/**
 * MovieShareChart — Donut Chart tỷ lệ doanh thu theo phim
 * Props:
 *   data    (array) — MovieShareStatResponse[]
 *   loading (boolean)
 */
const MovieShareChart = ({ data = [], loading = false }) => {
    return (
        <div className="chart-card">
            <div className="chart-card__header">
                <h3 className="chart-card__title">Top 10 phim bán chạy theo doanh thu</h3>
            </div>

            {loading ? (
                <div className="chart-card__skeleton" />
            ) : data.length === 0 ? (
                <div className="chart-card__empty">Chưa có dữ liệu doanh thu</div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="revenue"
                            nameKey="movieTitle"
                            innerRadius="55%"
                            outerRadius="78%"
                            paddingAngle={2}
                        >
                            {data.map((_, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) =>
                                value.length > 20 ? value.substring(0, 20) + '…' : value
                            }
                            wrapperStyle={{ fontSize: 11 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default MovieShareChart;
