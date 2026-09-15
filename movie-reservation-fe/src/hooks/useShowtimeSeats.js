import { useState, useEffect, useCallback, useRef } from 'react';
import { seatApi } from '../api/seatApi';
import toast from 'react-hot-toast';

// Helper to fire synchronous/keepalive release request on page unload/close
const releaseSeatsKeepAlive = (stId, token, seats) => {
    if (!stId || !token || !seats || seats.length === 0) return;
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const url = `${baseURL}/showtime-seats/release`;
    const accessToken = localStorage.getItem('accessToken');
    const payload = JSON.stringify({
        showtimeId: Number(stId),
        seatIds: seats.map((s) => s.seatId),
        holdToken: token
    });

    try {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
            },
            body: payload,
            keepalive: true
        }).catch(() => {});
    } catch (e) {
        console.warn('Keepalive seat release failed:', e);
    }
};

export const useShowtimeSeats = (showtimeId) => {
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [holdToken, setHoldToken] = useState(null);
    const [expiresAt, setExpiresAt] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHolding, setIsHolding] = useState(false);
    const [isReleasing, setIsReleasing] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);

    // Flag to mark if reservation/checkout has completed (do not release on leave)
    const isCompletedRef = useRef(false);

    // Keep refs up-to-date for cleanup/event listeners
    const holdTokenRef = useRef(null);
    const selectedSeatsRef = useRef([]);
    const showtimeIdRef = useRef(showtimeId);

    useEffect(() => {
        holdTokenRef.current = holdToken;
        selectedSeatsRef.current = selectedSeats;
        showtimeIdRef.current = showtimeId;
    }, [holdToken, selectedSeats, showtimeId]);

    // Save or clear session in sessionStorage for seamless tab restore / reload
    useEffect(() => {
        if (!showtimeId) return;
        if (holdToken && selectedSeats.length > 0 && expiresAt) {
            sessionStorage.setItem(
                `booking_hold_${showtimeId}`,
                JSON.stringify({ holdToken, selectedSeats, expiresAt })
            );
        } else {
            sessionStorage.removeItem(`booking_hold_${showtimeId}`);
        }
    }, [showtimeId, holdToken, selectedSeats, expiresAt]);

    // Lấy sơ đồ ghế từ Backend & khôi phục phiên nếu F5/Refresh
    const fetchSeatMap = useCallback(async (keepSelection = false, silent = false) => {
        if (!showtimeId) {
            setSeats([]);
            setSelectedSeats([]);
            setHoldToken(null);
            setExpiresAt(null);
            setIsLoading(false);
            return;
        }
        if (!silent) {
            setIsLoading(true);
            setIsError(false);
            setError(null);
        }

        try {
            const data = await seatApi.getShowtimeSeats(showtimeId);
            const seatList = Array.isArray(data) ? data : (data?.content || []);
            setSeats(seatList);

            if (!keepSelection) {
                // Try restoring session from sessionStorage if available & not expired
                const storedRaw = sessionStorage.getItem(`booking_hold_${showtimeId}`);
                let restored = false;

                if (storedRaw) {
                    try {
                        const parsed = JSON.parse(storedRaw);
                        if (
                            parsed &&
                            parsed.expiresAt &&
                            new Date(parsed.expiresAt).getTime() > Date.now() &&
                            Array.isArray(parsed.selectedSeats) &&
                            parsed.selectedSeats.length > 0
                        ) {
                            setHoldToken(parsed.holdToken);
                            setExpiresAt(parsed.expiresAt);
                            setSelectedSeats(parsed.selectedSeats);
                            restored = true;
                        } else {
                            sessionStorage.removeItem(`booking_hold_${showtimeId}`);
                        }
                    } catch {
                        sessionStorage.removeItem(`booking_hold_${showtimeId}`);
                    }
                }

                if (!restored) {
                    setSelectedSeats([]);
                    setHoldToken(null);
                    setExpiresAt(null);
                }
            }
        } catch (err) {
            if (!silent) {
                console.error('Failed to fetch seat map:', err);
                setIsError(true);
                setError(err.message || 'Không thể tải sơ đồ ghế');
                toast.error(err.message || 'Không thể tải sơ đồ ghế');
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, [showtimeId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSeatMap(false);
    }, [fetchSeatMap]);

    // Silent Background Polling (Every 5 seconds) to reflect seat state changes in real-time
    useEffect(() => {
        if (!showtimeId) return;

        const intervalId = setInterval(() => {
            fetchSeatMap(true, true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [showtimeId, fetchSeatMap]);

    // Auto-release on page close / tab exit / reload via beforeunload keepalive
    useEffect(() => {
        const handleBeforeUnload = () => {
            const token = holdTokenRef.current;
            const seatsToRelease = selectedSeatsRef.current;
            const stId = showtimeIdRef.current;

            if (token && seatsToRelease && seatsToRelease.length > 0 && !isCompletedRef.current) {
                releaseSeatsKeepAlive(stId, token, seatsToRelease);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Auto-release on component unmount (SPA Navigation to Home, Movies, etc.)
    useEffect(() => {
        return () => {
            const token = holdTokenRef.current;
            const seatsToRelease = selectedSeatsRef.current;
            const stId = showtimeIdRef.current;

            if (token && seatsToRelease && seatsToRelease.length > 0 && !isCompletedRef.current) {
                // Asynchronously release seats
                seatApi
                    .releaseSeats({
                        showtimeId: Number(stId),
                        seatIds: seatsToRelease.map((s) => s.seatId),
                        holdToken: token
                    })
                    .catch(() => {});
                sessionStorage.removeItem(`booking_hold_${stId}`);
            }
        };
    }, [showtimeId]);

    // Click ghế: Instant Hold / Release
    const toggleSeat = async (seat) => {
        if (!showtimeId) return;
        if (isHolding || isReleasing) return; // Prevent spam clicks while in-flight

        // Check if seat is currently held by me
        const isHeldByMe = selectedSeats.some((s) => s.seatId === seat.seatId);

        if (isHeldByMe) {
            // DESELECT: Release this specific seat immediately
            const currentToken = holdTokenRef.current;
            if (!currentToken) return;

            setIsReleasing(true);
            try {
                await seatApi.releaseSeats({
                    showtimeId: Number(showtimeId),
                    seatIds: [seat.seatId],
                    holdToken: currentToken
                });

                // Update selectedSeats state
                setSelectedSeats((prev) => {
                    const next = prev.filter((s) => s.seatId !== seat.seatId);
                    if (next.length === 0) {
                        setHoldToken(null);
                        setExpiresAt(null);
                        sessionStorage.removeItem(`booking_hold_${showtimeId}`);
                    }
                    return next;
                });

                // Mark seat as AVAILABLE in local state
                setSeats((prev) =>
                    prev.map((s) => (s.seatId === seat.seatId ? { ...s, status: 'AVAILABLE' } : s))
                );
            } catch (err) {
                console.error('Failed to release seat:', err);
                toast.error(err.message || 'Không thể giải phóng ghế.');
                await fetchSeatMap(false);
            } finally {
                setIsReleasing(false);
            }
            return;
        }

        // SELECT: Seat must be AVAILABLE
        if (seat.status !== 'AVAILABLE') {
            if (seat.status === 'SOLD') {
                toast.error('Ghế này đã được bán.');
            } else if (seat.status === 'HELD') {
                toast.error('Ghế này đang được người khác giữ chỗ.');
            }
            return;
        }

        if (selectedSeats.length >= 8) {
            toast.error('Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt.');
            return;
        }

        // Call Backend to hold seat immediately
        setIsHolding(true);
        try {
            const currentToken = holdTokenRef.current;
            const response = await seatApi.holdSeats({
                showtimeId: Number(showtimeId),
                seatIds: [seat.seatId],
                holdToken: currentToken || undefined
            });

            // Set session token & expiresAt (preserved from backend)
            setHoldToken(response.holdToken);
            setExpiresAt(response.expiresAt);

            // Add to selectedSeats and update local seat status
            setSelectedSeats((prev) => [...prev, seat]);
            setSeats((prev) =>
                prev.map((s) => (s.seatId === seat.seatId ? { ...s, status: 'HELD' } : s))
            );
        } catch (err) {
            console.error('Failed to hold seat:', err);
            const status = err.status || err.statusCode;
            if (status === 409) {
                toast.error('Ghế vừa bị người khác chọn. Vui lòng chọn ghế khác.');
            } else if (status === 401) {
                toast.error('Vui lòng đăng nhập để chọn ghế.');
            } else {
                toast.error(err.message || 'Không thể giữ ghế. Vui lòng thử lại.');
            }
            // Sync seat map to show actual backend status
            await fetchSeatMap(selectedSeats.length > 0);
        } finally {
            setIsHolding(false);
        }
    };

    // Giải phóng toàn bộ ghế khi hủy / rời khỏi flow
    const releaseAllSeats = async () => {
        const currentToken = holdTokenRef.current;
        if (!currentToken || selectedSeats.length === 0) {
            setSelectedSeats([]);
            setHoldToken(null);
            setExpiresAt(null);
            sessionStorage.removeItem(`booking_hold_${showtimeId}`);
            return;
        }

        setIsReleasing(true);
        try {
            const seatIds = selectedSeats.map((s) => s.seatId);
            await seatApi.releaseSeats({
                showtimeId: Number(showtimeId),
                seatIds,
                holdToken: currentToken
            });
        } catch (err) {
            console.warn('Release all seats failed or already expired:', err);
        } finally {
            setSelectedSeats([]);
            setHoldToken(null);
            setExpiresAt(null);
            sessionStorage.removeItem(`booking_hold_${showtimeId}`);
            setIsReleasing(false);
            await fetchSeatMap(false);
        }
    };

    // Mark as completed (e.g. reservation created)
    const markCompleted = () => {
        isCompletedRef.current = true;
    };

    // Xử lý khi hết hạn giữ ghế
    const handleExpired = useCallback(async () => {
        toast.error('Thời gian giữ ghế đã hết hạn! Vui lòng chọn lại ghế.', { duration: 6000 });
        setSelectedSeats([]);
        setHoldToken(null);
        setExpiresAt(null);
        sessionStorage.removeItem(`booking_hold_${showtimeId}`);
        await fetchSeatMap(false);
    }, [fetchSeatMap, showtimeId]);

    return {
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
        releaseSeats: releaseAllSeats,
        markCompleted,
        handleExpired,
        refetch: fetchSeatMap
    };
};

export default useShowtimeSeats;
