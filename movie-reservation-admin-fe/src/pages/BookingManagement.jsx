import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Ticket, RotateCcw } from 'lucide-react';
import bookingAdminApi from '../api/bookingAdminApi';
import BookingFilters from '../components/bookings/BookingFilters';
import BookingTable from '../components/bookings/BookingTable';
import BookingDetailDrawer from '../components/bookings/BookingDetailDrawer';
import Pagination from '../components/Pagination';

const BookingManagement = () => {
    // Data states
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [bookingStatus, setBookingStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [showtimeDate, setShowtimeDate] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Drawer state
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Debounce search term (400ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    // Reset page to 0 when filters or search change
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, bookingStatus, paymentStatus, showtimeDate]);

    // Fetch Bookings list
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                size: pageSize,
                sort: 'createdAt,desc'
            };

            if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
            if (bookingStatus) params.bookingStatus = bookingStatus;
            if (paymentStatus) params.paymentStatus = paymentStatus;
            if (showtimeDate) params.showtimeDate = showtimeDate;

            const data = await bookingAdminApi.getBookings(params);

            if (data && data.content !== undefined) {
                setBookings(data.content || []);
                setTotalElements(data.totalElements || 0);
                setTotalPages(data.totalPages || 1);
            } else if (Array.isArray(data)) {
                setBookings(data);
                setTotalElements(data.length);
                setTotalPages(1);
            } else {
                setBookings([]);
                setTotalElements(0);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error fetching admin bookings:', err);
            const msg = err.response?.data?.message || 'Không thể tải danh sách đơn đặt vé.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch, bookingStatus, paymentStatus, showtimeDate]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Open detail drawer
    const handleSelectBooking = (reservationId) => {
        setSelectedBookingId(reservationId);
        setIsDrawerOpen(true);
    };

    // Close detail drawer
    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedBookingId(null);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setBookingStatus('');
        setPaymentStatus('');
        setShowtimeDate('');
        setPage(0);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Quản Lý Đặt Vé
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={fetchBookings}
                    disabled={loading}
                    className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                    <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
                    <span>Làm mới</span>
                </button>
            </div>

            {/* Filter and Search Bar */}
            <BookingFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                bookingStatus={bookingStatus}
                onBookingStatusChange={setBookingStatus}
                paymentStatus={paymentStatus}
                onPaymentStatusChange={setPaymentStatus}
                showtimeDate={showtimeDate}
                onShowtimeDateChange={setShowtimeDate}
                onResetFilters={handleResetFilters}
            />

            {/* Main Table */}
            <BookingTable
                bookings={bookings}
                loading={loading}
                error={error}
                onSelectBooking={handleSelectBooking}
                onRetry={fetchBookings}
            />

            {/* Server-side Pagination */}
            {!loading && !error && totalPages > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
                    <Pagination
                        pageNo={page}
                        pageSize={pageSize}
                        totalElements={totalElements}
                        totalPages={totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(0);
                        }}
                    />
                </div>
            )}

            {/* Booking Detail Drawer */}
            <BookingDetailDrawer
                isOpen={isDrawerOpen}
                bookingId={selectedBookingId}
                onClose={handleCloseDrawer}
                onCheckInUpdated={fetchBookings}
            />
        </div>
    );
};

export default BookingManagement;
