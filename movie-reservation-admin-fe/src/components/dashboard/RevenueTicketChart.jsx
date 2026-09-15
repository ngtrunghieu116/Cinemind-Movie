import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

/**
 * Format revenue (VND) — abbreviated for Y-axis labels
 */
const fmtRevenue = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
    return v;
};

const fmtTooltipRevenue = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

/**
 * Custom tooltip component
 */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip__date">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className="chart-tooltip__row">
                    <span>{entry.name}:</span>
                    <strong>
                        {entry.dataKey === 'revenue'
                            ? fmtTooltipRevenue(entry.value)
                            : entry.value.toLocaleString('vi-VN')}
                    </strong>
                </p>
            ))}
        </div>
    );
};

/**
 * RevenueTicketChart — dual-axis Line Chart
 * Props:
 *   data    (array) — DailyRevenueStatResponse[]
 *   loading (boolean)
 */
const RevenueTicketChart = ({ data = [], loading = false }) => {
    // Format date label for X-axis
    const chartData = data.map((d) => ({
        ...d,
        dateLabel: d.date ? d.date.substring(5) : '',   // mm-dd
        revenue: Number(d.revenue),
        ticketCount: Number(d.ticketCount),
    }));

    return (
        <div className="chart-card">
            <div className="chart-card__header">
                <h3 className="chart-card__title">Xu hướng Doanh thu &amp; Lượng vé</h3>
                <p className="chart-card__sub">Theo ngày trong khoảng thời gian đã chọn</p>
            </div>

            {loading ? (
                <div className="chart-card__skeleton" />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 0, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                        />
                        {/* Left Y-axis: Revenue */}
                        <YAxis
                            yAxisId="left"
                            tickFormatter={fmtRevenue}
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickLine={false}
                            axisLine={false}
                            width={52}
                        />
                        {/* Right Y-axis: Ticket count */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickLine={false}
                            axisLine={false}
                            width={36}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                            iconType="circle"
                            iconSize={8}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            name="Doanh thu (VND)"
                            stroke="#c0392b"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="ticketCount"
                            name="Số vé bán"
                            stroke="#2c3e50"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default RevenueTicketChart;
