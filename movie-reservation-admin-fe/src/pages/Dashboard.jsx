import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import statisticsApi from '../api/statisticsApi';
import StatCard from '../components/dashboard/StatCard';
import RevenueTicketChart from '../components/dashboard/RevenueTicketChart';
import MovieShareChart from '../components/dashboard/MovieShareChart';
import TopMoviesTable from '../components/dashboard/TopMoviesTable';
import RoomPerformanceTable from '../components/dashboard/RoomPerformanceTable';

// ─── Helpers ──────────────────────────────────────────────────
const today = () => new Date().toISOString().substring(0, 10);
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().substring(0, 10);
};

const fmtVND = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v));

const PRESETS = [
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
    { label: '90 ngày', value: 90 },
];

// ─── Export CSV (UTF-8 BOM) ───────────────────────────────────
const exportCSV = (rows, filename) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
        headers.join(','),
        ...rows.map((r) =>
            headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
        ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── Main Dashboard Component ─────────────────────────────────
const Dashboard = () => {
    const [dateFilter, setDateFilter] = useState(today());
    const [fromDate, setFromDate] = useState(daysAgo(29));
    const [toDate, setToDate] = useState(today());
    const [preset, setPreset] = useState(30);

    const [overview, setOverview] = useState(null);
    const [dailyData, setDailyData] = useState([]);
    const [movieShare, setMovieShare] = useState([]);
    const [topMovies, setTopMovies] = useState([]);
    const [roomPerf, setRoomPerf] = useState([]);

    const [loadingOverview, setLoadingOverview] = useState(false);
    const [loadingDaily, setLoadingDaily] = useState(false);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);

    const [error, setError] = useState(null);

    // ── Fetch Overview (KPI cards for selected day) ─────────
    const fetchOverview = useCallback(async () => {
        setLoadingOverview(true);
        try {
            const data = await statisticsApi.getOverview(dateFilter);
            setOverview(data);
        } catch (e) {
            console.error('Overview fetch failed:', e);
            setError('Không thể tải dữ liệu tổng quan. Vui lòng kiểm tra kết nối.');
        } finally {
            setLoadingOverview(false);
        }
    }, [dateFilter]);

    // ── Fetch Charts & Tables (range-based) ─────────────────
    const fetchRangeData = useCallback(async () => {
        setLoadingDaily(true);
        setLoadingMovies(true);
        setLoadingRooms(true);
        setError(null);

        try {
            const [daily, share, top, rooms] = await Promise.allSettled([
                statisticsApi.getDailyRevenue(fromDate, toDate),
                statisticsApi.getMovieShare(fromDate, toDate),
                statisticsApi.getTopMovies(fromDate, toDate, 10),
                statisticsApi.getRoomPerformance(fromDate, toDate),
            ]);

            if (daily.status === 'fulfilled') setDailyData(daily.value ?? []);
            if (share.status === 'fulfilled') setMovieShare(share.value ?? []);
            if (top.status === 'fulfilled') setTopMovies(top.value ?? []);
            if (rooms.status === 'fulfilled') setRoomPerf(rooms.value ?? []);
        } catch (e) {
            console.error('Range data fetch failed:', e);
            setError('Không thể tải dữ liệu biểu đồ.');
        } finally {
            setLoadingDaily(false);
            setLoadingMovies(false);
            setLoadingRooms(false);
        }
    }, [fromDate, toDate]);

    // ── Preset handler ───────────────────────────────────────
    const applyPreset = (days) => {
        setPreset(days);
        setFromDate(daysAgo(days - 1));
        setToDate(today());
    };

    useEffect(() => { fetchOverview(); }, [fetchOverview]);
    useEffect(() => { fetchRangeData(); }, [fetchRangeData]);

    // ── KPI Card definitions ──────────────────────────────────
    const kpiCards = [
        {
            label: 'Doanh thu hôm nay',
            value: overview ? fmtVND(overview.todayRevenue) : '—',
            subLabel: `Tháng này: ${overview ? fmtVND(overview.currentMonthRevenue) : '—'}`,
            accent: true,
        },
        {
            label: 'Vé bán hôm nay',
            value: overview ? Number(overview.todayTickets).toLocaleString('vi-VN') : '—',
            subLabel: `Tổng: ${overview ? Number(overview.totalTickets).toLocaleString('vi-VN') : '—'} vé`,
        },
        {
            label: 'Khách hàng mới hôm nay',
            value: overview ? Number(overview.todayNewUsers).toLocaleString('vi-VN') : '—',
            subLabel: `Tổng: ${overview ? Number(overview.totalUsers).toLocaleString('vi-VN') : '—'} người`,
        },
        {
            label: 'Suất chiếu hôm nay',
            value: overview ? Number(overview.todayShowtimes).toLocaleString('vi-VN') : '—',
            subLabel: `Phim đang chiếu tháng này: ${overview ? Number(overview.activeMovies).toLocaleString('vi-VN') : '—'}`,
        },
    ];

    return (
        <div className="dashboard">
            {/* ── Page Header ─────────────────────────────── */}
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Báo cáo &amp; Thống kê</h1>

                </div>

                {/* Day picker for KPI */}
                <div className="dashboard__controls">
                    <label className="dashboard__date-label">Ngày thống kê:</label>
                    <input
                        id="kpi-date-picker"
                        type="date"
                        className="dashboard__date-input"
                        value={dateFilter}
                        max={today()}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="dashboard__error" role="alert">{error}</div>
            )}

            {/* ── KPI Cards ───────────────────────────────── */}
            <div className="dashboard__kpi-grid">
                {kpiCards.map((c, i) => (
                    <StatCard
                        key={i}
                        label={c.label}
                        value={c.value}
                        subLabel={c.subLabel}
                        accent={c.accent}
                        loading={loadingOverview}
                    />
                ))}
            </div>

            {/* ── Range Filter ─────────────────────────────── */}
            <div className="dashboard__range-bar">
                <span className="dashboard__range-label">Khoảng thời gian biểu đồ:</span>

                <div className="dashboard__preset-group">
                    {PRESETS.map((p) => (
                        <button
                            key={p.value}
                            id={`preset-${p.value}d`}
                            className={`dashboard__preset-btn${preset === p.value ? ' active' : ''}`}
                            onClick={() => applyPreset(p.value)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <input
                    id="range-from"
                    type="date"
                    className="dashboard__date-input"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => { setFromDate(e.target.value); setPreset(null); }}
                />
                <span className="dashboard__range-sep">—</span>
                <input
                    id="range-to"
                    type="date"
                    className="dashboard__date-input"
                    value={toDate}
                    max={today()}
                    onChange={(e) => { setToDate(e.target.value); setPreset(null); }}
                />

                <button
                    id="export-csv-btn"
                    className="dashboard__export-btn"
                    onClick={() =>
                        exportCSV(
                            topMovies.map((m) => ({
                                'Tên phim': m.movieTitle,
                                'Vé bán': m.ticketsSold,
                                'Đặt vé': m.bookingCount,
                                'Doanh thu (VND)': m.revenue,
                                'Tỷ lệ (%)': m.revenuePercentage?.toFixed(2),
                            })),
                            `cinemind_top_movies_${fromDate}_${toDate}.csv`
                        )
                    }
                >
                    Xuất CSV
                </button>
            </div>

            {/* ── Charts Row ───────────────────────────────── */}
            <div className="dashboard__charts-grid">
                <RevenueTicketChart data={dailyData} loading={loadingDaily} />
                <MovieShareChart data={movieShare} loading={loadingMovies} />
            </div>

            {/* ── Tables Row ───────────────────────────────── */}
            <div className="dashboard__tables-grid">
                <TopMoviesTable data={topMovies} loading={loadingMovies} />
                <RoomPerformanceTable data={roomPerf} loading={loadingRooms} />
            </div>
        </div>
    );
};

export default Dashboard;
