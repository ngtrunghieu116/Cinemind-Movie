import { AlertCircle } from 'lucide-react';

export const MovieShowtimesSection = ({
    datesList,
    isDatesLoading,
    selectedDateIndex,
    onSelectDate,
    showtimes = [],
    isLoading,
    isError,
    onRefetch,
    selectedShowtime,
    onSelectShowtime,
    timeLeftFormatted,
    isExpiringSoon,
    movieStatus,
    showtimesRef
}) => {
    const selectedDateObj = datesList[selectedDateIndex];

    const sortedShowtimes = [...showtimes].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const isComingSoon = movieStatus === 'COMING_SOON';
    const isEnded = movieStatus === 'ENDED';

    return (
        <div ref={showtimesRef} className="w-full bg-slate-50 border-t border-b border-slate-200/80 my-4">
            
            {/* 1. Date Selector Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline whitespace-nowrap">
                        Lịch chiếu:
                    </span>
                    
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {isDatesLoading ? (
                            <div className="flex items-center space-x-2 text-xs text-slate-500 py-3">
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                <span>Đang tải lịch chiếu...</span>
                            </div>
                        ) : datesList.length === 0 ? (
                            <span className="text-xs text-slate-500 italic py-3">
                                {isComingSoon
                                    ? 'Phim sắp chiếu - chưa có lịch chiếu.'
                                    : isEnded
                                    ? 'Phim đã kết thúc đợt chiếu.'
                                    : 'Hiện chưa có ngày chiếu khả dụng cho phim này.'}
                            </span>
                        ) : (
                            datesList.map((d, index) => {
                                const isSelected = index === selectedDateIndex;
                                return (
                                    <button
                                        key={d.dateStr}
                                        type="button"
                                        onClick={() => onSelectDate(index)}
                                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl flex flex-col items-center min-w-[5.5rem] transition-all duration-200 border cursor-pointer select-none ${
                                            isSelected
                                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                                                : 'bg-white text-slate-600 border-slate-200/80 hover:border-red-600 hover:text-slate-900 shadow-xs'
                                        }`}
                                    >
                                        <span className={`text-[11px] font-semibold tracking-wider ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                                            {d.monthLabel}
                                        </span>
                                        <span className={`text-xl sm:text-2xl font-black my-0.5 font-mono ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                            {d.dayNum}
                                        </span>
                                        <span className={`text-[11px] font-medium ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                                            {d.dayFullLabel}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Showtime Selection & Countdown Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    
                    {/* Left: Showtime Pills */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-slate-700 mr-1">Giờ chiếu:</span>
                        
                        {isLoading ? (
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                <span>Đang tải suất chiếu...</span>
                            </div>
                        ) : isError ? (
                            <div className="flex items-center space-x-2 text-xs text-red-600">
                                <span>Lỗi tải suất chiếu.</span>
                                <button onClick={onRefetch} className="underline hover:text-slate-900 cursor-pointer">
                                    Thử lại
                                </button>
                            </div>
                        ) : sortedShowtimes.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2.5">
                                {sortedShowtimes.map((st) => {
                                    const startTime = new Date(st.startTime);
                                    const timeStr = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                    const isStSelected = selectedShowtime?.id === st.id;

                                    return (
                                        <button
                                            key={st.id}
                                            type="button"
                                            onClick={() => onSelectShowtime(st)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-bold font-mono transition-all duration-200 border cursor-pointer ${
                                                isStSelected
                                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-red-600 hover:text-red-600 shadow-xs'
                                            }`}
                                        >
                                            {timeStr}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-500 italic">
                                {isComingSoon 
                                    ? 'Phim sắp chiếu - chưa có suất chiếu.'
                                    : isEnded
                                    ? 'Phim đã kết thúc đợt chiếu.'
                                    : `Không có suất chiếu trong ngày ${selectedDateObj?.displayDate || ''}.`}
                            </span>
                        )}
                    </div>

                    {/* Right: Countdown Pill */}
                    <div className="flex items-center self-start sm:self-auto">
                        <div className="px-4 py-1.5 rounded-lg bg-white border border-slate-200/80 flex items-center space-x-2 shadow-xs">
                            <span className="text-xs text-slate-600">Thời gian chọn ghế:</span>
                            <span className={`text-sm font-bold font-mono ${
                                isExpiringSoon ? 'text-red-600 animate-pulse' : 'text-amber-600'
                            }`}>
                                {selectedShowtime && timeLeftFormatted ? timeLeftFormatted : '10:00'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Empty State Notification */}
                {!isLoading && !isError && sortedShowtimes.length === 0 && (
                    <div className="my-6 p-6 rounded-2xl bg-white border border-slate-200/80 text-center space-y-2 max-w-lg mx-auto shadow-sm">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-900">Chưa có suất chiếu</h4>
                        <p className="text-xs text-slate-500">
                            Vui lòng chọn một ngày khác trên thanh lịch chiếu để tìm kiếm suất chiếu khả dụng.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieShowtimesSection;
