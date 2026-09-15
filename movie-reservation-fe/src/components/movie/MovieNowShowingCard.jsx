import { useNavigate, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import posterPlaceholder from '../../assets/images/poster-placeholder.svg';

const AGE_RATING_WARNING_TEXT = {
    P: 'Phim được phép phổ biến đến người xem ở mọi độ tuổi',
    K: 'Phim được phổ biến đến người xem dưới 13 tuổi và có người bảo hộ đi kèm',
    T13: 'Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (13+)',
    C13: 'Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (13+)',
    T16: 'Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (16+)',
    C16: 'Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (16+)',
    T18: 'Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên (18+)',
    C18: 'Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên (18+)'
};

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Đang cập nhật';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
};

const MovieNowShowingCard = ({ movie, showtimes = [] }) => {
    const navigate = useNavigate();

    if (!movie) return null;

    const ageWarning = AGE_RATING_WARNING_TEXT[movie.ageRating] || AGE_RATING_WARNING_TEXT.P;
    const formattedGenres = movie.genres && movie.genres.length > 0 ? movie.genres.join(', ') : 'Chưa phân loại';
    const formattedReleaseDate = formatDateDisplay(movie.releaseDate);

    // Sort showtimes chronologically
    const sortedShowtimes = [...showtimes].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const handleSelectShowtime = (stId) => {
        navigate(`/movies/${movie.id}?showtimeId=${stId}`);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-900 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-300 relative group overflow-hidden">
            
            {/* Left Column: Poster (30-35% width, Aspect Ratio 2:3) */}
            <div className="w-full sm:w-1/3 flex-shrink-0">
                <Link to={`/movies/${movie.id}`} className="block relative aspect-[2/3] rounded-xl overflow-hidden shadow-xs group-hover:shadow-md transition">
                    <img 
                        src={movie.poster} 
                        alt={movie.title} 
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = posterPlaceholder;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                </Link>
            </div>

            {/* Right Column: Information Area (65-70% width) */}
            <div className="w-full sm:w-2/3 flex flex-col justify-between space-y-3 relative">
                
                {/* Format Badge (Top Right) */}
                <div className="absolute top-0 right-0">
                    <span className="px-2.5 py-0.5 bg-red-600 text-white font-extrabold text-[11px] rounded-md uppercase tracking-wider shadow-xs">
                        2D
                    </span>
                </div>

                <div className="space-y-2 pr-12">
                    {/* Genre & Duration Line */}
                    <div className="text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-1.5">
                        <span className="text-red-600 font-bold">{formattedGenres}</span>
                        <span>•</span>
                        <span className="text-slate-600">{movie.duration}</span>
                    </div>

                    {/* Movie Title */}
                    <Link to={`/movies/${movie.id}`}>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight uppercase leading-snug hover:text-red-600 transition line-clamp-2">
                            {movie.title}
                        </h3>
                    </Link>

                    {/* Origin Country */}
                    <div className="text-xs text-slate-600 font-medium">
                        <span className="text-slate-500">Xuất xứ: </span>
                        <span className="text-slate-800 font-semibold">{movie.country || 'Việt Nam'}</span>
                    </div>

                    {/* Release Date */}
                    <div className="text-xs text-slate-600 font-medium">
                        <span className="text-slate-500">Khởi chiếu: </span>
                        <span className="text-slate-800 font-semibold">{formattedReleaseDate}</span>
                    </div>

                    {/* Age Rating Warning Text */}
                    <div className="text-xs pt-1">
                        <p className="text-[11px] sm:text-xs text-red-600 font-medium leading-relaxed">
                            {ageWarning}
                        </p>
                    </div>
                </div>

                {/* Showtimes Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        <span>Lịch chiếu</span>
                    </h4>

                    {sortedShowtimes.length > 0 ? (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                            {sortedShowtimes.map((st) => {
                                const startTime = new Date(st.startTime);
                                const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <button
                                        key={st.id}
                                        onClick={() => handleSelectShowtime(st.id)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-600 text-slate-800 hover:text-white rounded-lg border border-slate-200 hover:border-red-600 transition text-xs font-bold cursor-pointer shadow-2xs"
                                    >
                                        {timeStr}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic py-1">
                            Phim hiện chưa có suất chiếu.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MovieNowShowingCard;
