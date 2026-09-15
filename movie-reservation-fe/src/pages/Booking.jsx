import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../components/ui/Loading';
import SeatSelection from '../components/booking/SeatSelection';
import BookingSummary from '../components/booking/BookingSummary';
import ComboSelection from '../components/booking/ComboSelection';
import { useShowtimeSeats } from '../hooks/useShowtimeSeats';
import { reservationApi } from '../api/reservationApi';
import { AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import ROUTES from '../constants/routes';
import toast from 'react-hot-toast';

export const Booking = () => {
    const { showtimeId } = useParams();
    const navigate = useNavigate();

    // Step management (1: Seat Selection, 2: F&B Selection)
    const [currentStep, setCurrentStep] = useState(1);

    // Reservation state
    const [reservationId, setReservationId] = useState(null);
    const [reservationData, setReservationData] = useState(null);
    const [isCreatingReservation, setIsCreatingReservation] = useState(false);

    // Seat management from hook
    const {
        seats,
        selectedSeats,
        holdToken,
        expiresAt,
        isLoading,
        isHolding,
        isReleasing,
        isError,
        error,
        toggleSeat,
        releaseSeats,
        markCompleted,
        handleExpired: hookHandleExpired,
        refetch
    } = useShowtimeSeats(showtimeId);

    // Enhanced expiration handler
    const handleExpired = useCallback(async () => {
        setReservationId(null);
        setReservationData(null);
        setCurrentStep(1);
        await hookHandleExpired();
    }, [hookHandleExpired]);

    // Format remaining time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Countdown calculation from Backend expiresAt
    const [timeLeft, setTimeLeft] = useState(600);
    useEffect(() => {
        if (!expiresAt) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTimeLeft(600);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const exp = new Date(expiresAt).getTime();
            const diffSeconds = Math.max(0, Math.floor((exp - now) / 1000));
            setTimeLeft(diffSeconds);

            if (diffSeconds === 0) {
                handleExpired();
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);
        return () => clearInterval(intervalId);
    }, [expiresAt, handleExpired]);

    const isExpiringSoon = timeLeft < 120 && timeLeft > 0;

    // STEP 1 -> STEP 2 (Create Reservation)
    const handleContinueFromStep1 = async () => {
        if (!holdToken || selectedSeats.length === 0) {
            toast.error('Vui lòng chọn ít nhất một ghế trước khi tiếp tục.');
            return;
        }

        setIsCreatingReservation(true);
        try {
            const seatIds = selectedSeats.map((s) => s.seatId);
            const response = await reservationApi.createReservation({
                showtimeId: Number(showtimeId),
                seatIds,
                holdToken
            });

            setReservationId(response.reservationId);
            setReservationData(response);
            markCompleted();
            setCurrentStep(2);
            toast.success('Đã tạo đơn giữ chỗ! Chọn bắp nước nếu muốn.');
        } catch (err) {
            console.error('Failed to create reservation:', err);
            const status = err.status || err.statusCode;
            if (status === 409) {
                toast.error('Ghế đã bị người khác đặt trước. Vui lòng chọn ghế khác.');
                await refetch(false);
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

    // STEP 2 -> CHECKOUT / PAYMENT PAGE (/payment/:reservationId)
    const handleContinueFromStep2 = () => {
        if (!reservationId) {
            toast.error('Không tìm thấy đơn hàng để thanh toán.');
            return;
        }
        navigate(`/payment/${reservationId}`);
    };

    const handleBack = async () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        } else if (currentStep === 1) {
            if (selectedSeats.length > 0) {
                await releaseSeats();
            }
            navigate(-1);
        }
    };

    const handleContinue = () => {
        if (currentStep === 1) {
            handleContinueFromStep1();
        } else if (currentStep === 2) {
            handleContinueFromStep2();
        }
    };

    const handleReservationUpdate = (newData) => {
        setReservationData(newData);
    };

    const showtimeInfo = {
        movieTitle: reservationData?.movieTitle || `Suất Chiếu #${showtimeId}`,
        startTime: reservationData?.showtimeStart || null,
        roomName: reservationData?.roomName || null,
        theaterName: 'Cinemind',
    };

    const startTimeFormatted = showtimeInfo.startTime 
        ? new Date(showtimeInfo.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
        : '--:--';

    return (
        <div className="min-h-screen bg-[#0B0F14] pb-[120px] font-sans selection:bg-[#E50914] selection:text-white relative">
            {/* 1. TOP INFORMATION BAR */}
            <div className="w-full bg-[#0F141B] border-b border-[#2A323E] px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center space-x-2 text-[#CBD5E1]">
                    <span className="text-sm hidden sm:inline">Giờ chiếu:</span>
                    <span className="text-sm sm:hidden">Giờ:</span>
                    <span className="text-base font-bold text-[#F8FAFC] font-mono">
                        {startTimeFormatted}
                    </span>
                </div>
                <div className="flex items-center space-x-2 text-[#CBD5E1]">
                    <span className="text-sm hidden sm:inline">Thời gian giữ chỗ:</span>
                    <span className="text-sm sm:hidden">T.Gian:</span>
                    <span className={`text-base font-bold font-mono ${isExpiringSoon ? 'text-[#E50914] animate-pulse' : 'text-[#F59E0B]'}`}>
                        {holdToken ? formatTime(timeLeft) : '10:00'}
                    </span>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* 2. LOADING & ERROR STATES */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[450px] bg-[#121821] rounded-2xl border border-[#2A323E]">
                        <Loading />
                        <p className="mt-4 text-[#94A3B8] text-sm font-medium">Đang tải phòng chiếu...</p>
                    </div>
                )}

                {!isLoading && isError && (
                    <div className="flex flex-col items-center justify-center min-h-[350px] bg-[#121821] border border-[#7F1D1D]/40 rounded-2xl p-8 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-[#E50914]" />
                        <h3 className="text-lg font-bold text-[#F8FAFC]">Không thể tải sơ đồ ghế</h3>
                        <p className="text-sm text-[#94A3B8] max-w-md">{error || 'Suất chiếu không tồn tại hoặc đã bị dừng bán trực tuyến.'}</p>
                        <Button variant="primary" onClick={() => refetch(false)}>
                            Thử lại
                        </Button>
                    </div>
                )}

                {!isLoading && !isError && (
                    <div className="flex flex-col items-center w-full">
                        
                        {/* STEP 1: SEAT MAP */}
                        {currentStep === 1 && (
                            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                                <SeatSelection
                                    seats={seats}
                                    selectedSeats={selectedSeats}
                                    onToggleSeat={toggleSeat}
                                    roomName={showtimeInfo.roomName || 'Phòng chiếu số 11'}
                                />
                            </div>
                        )}

                        {/* STEP 2: F&B SELECTION */}
                        {currentStep === 2 && reservationId && (
                            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <ComboSelection
                                    reservationId={reservationId}
                                    reservationData={reservationData}
                                    onReservationUpdate={handleReservationUpdate}
                                    disabled={!holdToken || timeLeft <= 0}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. BOTTOM BOOKING BAR */}
            {!isLoading && !isError && (
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
        </div>
    );
};

export default Booking;
