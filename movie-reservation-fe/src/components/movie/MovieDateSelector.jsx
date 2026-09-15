import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';

/**
 * Formats YYYY-MM-DD string to DD-MM-YYYY (ví dụ: 12-09-2026)
 * @param {string} dateStr 
 * @returns {string}
 */
const formatToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}-${month}-${year}`;
    }
    return dateStr;
};

const MovieDateSelector = ({ 
    availableDates = [], 
    selectedDateStr, 
    onSelectDate, 
    isLoading = false 
}) => {
    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                    <span>Đang tải lịch chiếu khả dụng...</span>
                </div>
            </div>
        );
    }

    if (!availableDates || availableDates.length === 0) {
        return (
            <div className="w-full flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-slate-400 text-sm italic bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Hiện chưa có lịch chiếu nào được xuất bản.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex items-center justify-center py-4">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 max-w-full scrollbar-thin scrollbar-thumb-slate-300 px-2">
                {availableDates.map((dateStr) => {
                    const isSelected = dateStr === selectedDateStr;
                    const displayDate = formatToDDMMYYYY(dateStr);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onSelectDate(dateStr)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition duration-200 flex items-center justify-center min-w-[7.5rem] cursor-pointer shadow-xs ${
                                isSelected
                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className="tracking-wider font-extrabold text-xs sm:text-sm">
                                {displayDate}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MovieDateSelector;
