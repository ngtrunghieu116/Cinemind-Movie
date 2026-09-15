import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '../hooks/useMovieDetail';
import { useMovieShowtimes } from '../hooks/useMovieShowtimes';
import { useShowtimeSeats } from '../hooks/useShowtimeSeats';
import { reservationApi } from '../api/reservationApi';
import { showtimeApi } from '../api/showtimeApi';

import MovieDetailHero from '../components/movie/MovieDetailHero';
import MovieShowtimesSection from '../components/movie/MovieShowtimesSection';
import SeatSelection from '../components/booking/SeatSelection';
import ComboSelection from '../components/booking/ComboSelection';
import BookingSummary from '../components/booking/BookingSummary';
import TrailerModal from '../components/movie/TrailerModal';
import MovieReviewsSection from '../components/review/MovieReviewsSection';

import { AlertCircle, ArrowLeft } from 'lucide-react';
import ROUTES from '../constants/routes';
import toast from 'react-hot-toast';

/**
 * Chuyển đổi danh sách ngày ISO (YYYY-MM-DD) từ API thành format hiển thị.
 */
const buildDatesList = (isoDateStrings) => {
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return isoDateStrings.map((dateStr) => {
        const parts = dateStr.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

        const isToday = dateStr === todayStr;
        const dayFullLabel = isToday ? 'Hôm nay' : dayNames[d.getDay()];
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');
        const monthLabel = `Th. ${monthNum}`;
        const displayDate = `${dayNum}/${monthNum}`;

        return {
            dateStr,
            dayFullLabel,
            monthLabel,
            dayNum,
            displayDate,
            rawDate: d
        };
    });
};

const MovieDetail = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // 1. Movie Data
    const { data: movie, isLoading: isMovieLoading, isError: isMovieError, error: movieError, refetch: refetchMovie } = useMovieDetail(id);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    // 2. Date Selection State - Lấy từ API thay vì sinh cứng 7 ngày
    const [datesList, setDatesList] = useState([]);
    const [isDatesLoading, setIsDatesLoading] = useState(true);
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const selectedDateObj = datesList[selectedDateIndex];

    // Fetch available dates from API
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setIsDatesLoading(true);

        showtimeApi.getAvailableDates(id)
            .then((data) => {
                if (cancelled) return;
                const dates = Array.isArray(data) ? data : [];
                setDatesList(buildDatesList(dates));
                setSelectedDateIndex(0);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to fetch available dates:', err);
                setDatesList([]);
            })
            .finally(() => {
                if (!cancelled) setIsDatesLoading(false);
            });

        return () => { cancelled = true; };
    }, [id]);

    // 3. Showtimes Data
    const { 
        data: showtimes, 
        isLoading: isShowtimesLoading, 
        isError: isShowtimesError, 
        refetch: refetchShowtimes 
    } = useMovieShowtimes(id, selectedDateObj?.dateStr);

    // 4. Selected Showtime State
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const seatMapRef = useRef(null);
    const showtimesRef = useRef(null);

    // 5. Booking Step & Reservation State
    const [currentStep, setCurrentStep] = useState(1); // 1 = Seats, 2 = F&B, 3 = Confirmation
    const [reservationId, setReservationId] = useState(null);
    const [reservationData, setReservationData] = useState(null);
    const [isCreatingReservation, setIsCreatingReservation] = useState(false);

    // 6. Seat Management via useShowtimeSeats Hook
    const {
        seats,
        selectedSeats,
        holdToken,
        expiresAt,
        isLoading: isSeatsLoading,
        isHolding,
        isReleasing,
        isError: isSeatsError,
        error: seatsError,
        toggleSeat,
        releaseSeats,
        markCompleted,
        handleExpired: hookHandleExpired,
        refetch: refetchSeats
    } = useShowtimeSeats(selectedShowtime?.id);

    // 7. Showtime Selection & 10-Minute Countdown Timer
    const [showtimeSelectedAt, setShowtimeSelectedAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    const handleExpired = useCallback(() => {
        setTimeLeft(0);
        hookHandleExpired();
        toast.error('Thời gian chọn ghế đã hết hạn (10 phút). Vui lòng chọn lại suất chiếu.');
        setSelectedShowtime(null);
        setShowtimeSelectedAt(null);
        setCurrentStep(1);
        setReservationId(null);
        setReservationData(null);
    }, [hookHandleExpired]);

    useEffect(() => {
        if (!selectedShowtime || !showtimeSelectedAt) {
            setTimeLeft(null);
            return;
        }

        const targetExpiry = expiresAt
            ? new Date(expiresAt).getTime()
            : showtimeSelectedAt + 10 * 60 * 1000;

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((targetExpiry - now) / 1000));
            setTimeLeft(diff);
            return diff;
        };

        const initial = updateTimer();
        if (initial <= 0) {
            handleExpired();
            return;
        }

        const timer = setInterval(() => {
            const remaining = updateTimer();
            if (remaining <= 0) {
                clearInterval(timer);
                handleExpired();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedShowtime, showtimeSelectedAt, expiresAt, handleExpired]);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isExpiringSoon = timeLeft !== null && timeLeft <= 120 && timeLeft > 0;

    // Auto-select showtime if specified in query params ?showtimeId=...
    useEffect(() => {
        const queryShowtimeId = searchParams.get('showtimeId');
        if (queryShowtimeId && Array.isArray(showtimes) && showtimes.length > 0) {
            const found = showtimes.find(st => String(st.id) === String(queryShowtimeId));
            if (found && (!selectedShowtime || selectedShowtime.id !== found.id)) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedShowtime(found);
                setShowtimeSelectedAt(Date.now());
                setTimeout(() => {
                    seatMapRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        }
    }, [searchParams, showtimes, selectedShowtime]);

    // Handle Select Showtime
    const handleSelectShowtime = (showtime) => {
        if (selectedShowtime?.id === showtime.id) return;
        if (selectedSeats.length > 0) {
            releaseSeats();
        }
        setSelectedShowtime(showtime);
        setShowtimeSelectedAt(Date.now());
        setCurrentStep(1);
        setReservationId(null);
        setReservationData(null);

        // Smooth scroll down to seat map
        setTimeout(() => {
            seatMapRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    };

    // Handle Date Change
    const handleSelectDate = (index) => {
        setSelectedDateIndex(index);
        if (selectedSeats.length > 0) {
            releaseSeats();
        }
        setSelectedShowtime(null);
        setShowtimeSelectedAt(null);
        setCurrentStep(1);
        setReservationId(null);
        setReservationData(null);
    };

    // Handle Scroll from Hero
    const handleScrollToShowtimes = () => {
        showtimesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Step 1 -> Step 2 (Create Reservation)
    const handleContinueFromStep1 = async () => {
        if (!holdToken || selectedSeats.length === 0) {
            toast.error('Vui lòng chọn ít nhất một ghế trước khi tiếp tục.');
            return;
        }

        setIsCreatingReservation(true);
        try {
            const seatIds = selectedSeats.map(s => s.seatId);
            const response = await reservationApi.createReservation({
                showtimeId: Number(selectedShowtime.id),
                seatIds,
                holdToken
            });

            setReservationId(response.reservationId);
            setReservationData(response);
            markCompleted();
            setCurrentStep(2);
            toast.success('Đã tạo đơn đặt vé! Chọn bắp nước nếu muốn.');
        } catch (err) {
            console.error('Failed to create reservation:', err);
            const status = err.status || err.statusCode;
            if (status === 409) {
                toast.error('Ghế đã bị người khác đặt trước. Vui lòng chọn ghế khác.');
                await refetchSeats(false);
                setCurrentStep(1);
            } else if (status === 401) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate(ROUTES.LOGIN);
            } else {
                toast.error(err.message || 'Không thể tạo đơn đặt vé. Vui lòng thử lại.');
            }
        } finally {
            setIsCreatingReservation(false);
        }
    };

    // Step 2 -> Step 3 (Direct to Checkout / Payment Page)
    const handleContinueFromStep2 = () => {
        if (!reservationId) {
            toast.error('Không tìm thấy đơn hàng để thanh toán.');
            return;
        }
        navigate(`/payment/${reservationId}`);
    };

    const handleContinue = () => {
        if (currentStep === 1) {
            handleContinueFromStep1();
        } else if (currentStep === 2) {
            handleContinueFromStep2();
        }
    };

    const handleBack = async () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        } else if (currentStep === 1) {
            if (selectedSeats.length > 0) {
                await releaseSeats();
            }
            setSelectedShowtime(null);
            setShowtimeSelectedAt(null);
            setReservationId(null);
            setReservationData(null);
        }
    };

    const handleReservationUpdate = (newData) => {
        setReservationData(newData);
    };

    // 7. Loading / Error States for Movie
    if (isMovieLoading) {
        return (
            <div className="w-full min-h-[calc(100vh-5rem)] bg-slate-50 flex flex-col justify-center items-center py-20 text-slate-900">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-medium">Đang tải thông tin phim...</p>
            </div>
        );
    }

    if (isMovieError || !movie) {
        return (
            <div className="w-full min-h-[calc(100vh-5rem)] bg-slate-50 flex items-center justify-center p-6 text-slate-900">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-4">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Không tìm thấy phim</h2>
                    <p className="text-sm text-slate-500">
                        {movieError || 'Phim bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.'}
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                        <button
                            onClick={refetchMovie}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition border border-slate-200 cursor-pointer"
                        >
                            Thử lại
                        </button>
                        <Link
                            to={ROUTES.HOME}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center gap-2 shadow-red-600/20"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Về Trang Chủ</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 text-slate-900 pb-32 font-sans">
            
            {/* 1. Hero Header Section */}
            <MovieDetailHero 
                movie={movie}
                onOpenTrailer={() => setIsTrailerOpen(true)}
                onScrollToShowtimes={handleScrollToShowtimes}
            />

            {/* 2. Date & Showtime Selection Section */}
            <MovieShowtimesSection 
                movie={movie}
                datesList={datesList}
                isDatesLoading={isDatesLoading}
                selectedDateIndex={selectedDateIndex}
                onSelectDate={handleSelectDate}
                showtimes={showtimes}
                isLoading={isShowtimesLoading}
                isError={isShowtimesError}
                onRefetch={refetchShowtimes}
                selectedShowtime={selectedShowtime}
                onSelectShowtime={handleSelectShowtime}
                holdToken={holdToken}
                timeLeftFormatted={formatTime(timeLeft)}
                isExpiringSoon={isExpiringSoon}
                sectionRef={showtimesRef}
            />

            {/* 3. Integrated Booking Workspace (Seat Selection / F&B / Confirmation) */}
            {selectedShowtime && (
                <div ref={seatMapRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
                    
                    {/* Error loading seats */}
                    {!isSeatsLoading && isSeatsError && (
                        <div className="p-8 rounded-2xl bg-white border border-red-200 text-center space-y-4 max-w-xl mx-auto shadow-xl">
                            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
                            <h4 className="text-base font-bold text-slate-900">Không thể tải sơ đồ ghế</h4>
                            <p className="text-xs text-slate-500">{seatsError || 'Suất chiếu không khả dụng hoặc đã dừng bán trực tuyến.'}</p>
                            <button
                                onClick={() => refetchSeats(false)}
                                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/20 cursor-pointer"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Loading seats */}
                    {isSeatsLoading && (
                        <div className="py-16 text-center space-y-3">
                            <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm text-slate-500 font-medium">Đang tải phòng chiếu & sơ đồ ghế...</p>
                        </div>
                    )}

                    {/* Step 1: Seat Map Grid & Screen */}
                    {!isSeatsLoading && !isSeatsError && currentStep === 1 && (
                        <div className="w-full animate-fadeIn">
                            <SeatSelection 
                                seats={seats}
                                selectedSeats={selectedSeats}
                                onToggleSeat={toggleSeat}
                                roomName={selectedShowtime.roomName || 'Phòng chiếu số 11'}
                            />
                        </div>
                    )}

                    {/* Step 2: F&B Selection */}
                    {!isSeatsLoading && currentStep === 2 && reservationId && (
                        <div className="w-full max-w-4xl mx-auto animate-fadeIn space-y-6">
                            <ComboSelection 
                                reservationId={reservationId}
                                reservationData={reservationData}
                                onReservationUpdate={handleReservationUpdate}
                                disabled={!holdToken || (timeLeft !== null && timeLeft <= 0)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 4. Fixed Bottom Booking Bar */}
            {selectedShowtime && (
                <BookingSummary 
                    selectedSeats={selectedSeats}
                    isHolding={isHolding}
                    isReleasing={isReleasing}
                    currentStep={currentStep}
                    reservationData={reservationData}
                    isCreatingReservation={isCreatingReservation}
                    onContinue={handleContinue}
                    onBack={handleBack}
                />
            )}

            {/* 5. User Reviews & Rating Section */}
            <div className="px-4 sm:px-6 lg:px-8 pb-16">
                <MovieReviewsSection movieId={movie.id} movieTitle={movie.title} />
            </div>

            {/* 6. Trailer Modal */}
            <TrailerModal 
                isOpen={isTrailerOpen}
                onClose={() => setIsTrailerOpen(false)}
                trailerUrl={movie.trailerUrl}
                movieTitle={movie.title}
            />
        </div>
    );
};

export default MovieDetail;
