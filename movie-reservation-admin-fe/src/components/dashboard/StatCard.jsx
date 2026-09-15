import React from 'react';

/**
 * StatCard — NiceAdmin-inspired KPI card
 * Props:
 *   label       (string)  — tiêu đề chỉ số
 *   value       (string)  — giá trị hiển thị lớn
 *   subLabel    (string)  — chú thích phụ (vd: "So với hôm qua")
 *   accent      (boolean) — nếu true: dùng màu đỏ chủ đạo (CineMind Red)
 *   loading     (boolean)
 */
const StatCard = ({ label, value, subLabel, accent = false, loading = false }) => {
    return (
        <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
            <p className="stat-card__label">{label}</p>
            {loading ? (
                <div className="stat-card__skeleton" />
            ) : (
                <p className="stat-card__value">{value ?? '—'}</p>
            )}
            {subLabel && (
                <p className="stat-card__sub">{subLabel}</p>
            )}
        </div>
    );
};

export default StatCard;
