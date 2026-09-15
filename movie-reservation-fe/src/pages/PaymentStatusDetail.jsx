import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertTriangle, Printer, ArrowLeft, RefreshCw, Loader2, Phone, ExternalLink } from 'lucide-react';
import { paymentApi } from '../api/paymentApi';

export const PaymentStatusDetail = () => {
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // null, '403', '404', '500'
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketData, setTicketData] = useState(null);

  const fetchDetailData = useCallback(async () => {
    setIsLoading(true);
    setErrorType(null);
    setErrorMessage('');

    const orderIdParam = searchParams.get('orderId');
    const vnpTxnRef = searchParams.get('vnp_TxnRef');
    const vnpSecureHash = searchParams.get('vnp_SecureHash');
    const vnpResCode = searchParams.get('vnp_ResponseCode');

    // 0. Trường hợp khách hàng hủy thanh toán tại VNPAY (vnp_ResponseCode = 24)
    if (vnpResCode === '24') {
      if (vnpTxnRef && vnpSecureHash) {
        try {
          const queryObj = Object.fromEntries(searchParams.entries());
          await paymentApi.getVnPayReturn(queryObj);
        } catch (e) {
          console.warn('VNPAY return cancel notification:', e);
        }
      }
      setTicketData({ reservationStatus: 'CANCELLED' });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Trường hợp từ VNPAY Redirect về thành công
      if (vnpTxnRef && vnpSecureHash) {
        const queryObj = Object.fromEntries(searchParams.entries());
        const returnRes = await paymentApi.getVnPayReturn(queryObj);
        const resolvedOrderId = returnRes?.orderId || returnRes?.bookingCode || vnpTxnRef;
        const statusDetail = await paymentApi.getPaymentStatus(resolvedOrderId);
        setTicketData(statusDetail);
      } 
      // 2. Trường hợp từ MyBookings hoặc Direct Link có orderId
      else if (orderIdParam) {
        const statusDetail = await paymentApi.getPaymentStatus(orderIdParam);
        setTicketData(statusDetail);
      } 
      // 3. Không có tham số hợp lệ
      else {
        setErrorType('404');
        setErrorMessage('Không tìm thấy thông tin đơn hàng hoặc mã tra cứu.');
      }
    } catch (err) {
      console.error('Failed to fetch payment status detail:', err);
      const status = err?.status || err?.statusCode || (err?.message?.includes('403') ? 403 : err?.message?.includes('404') ? 404 : 500);

      if (status === 403) {
        setErrorType('403');
        setErrorMessage('Bạn không có quyền truy cập thông tin vé của đơn hàng này.');
      } else if (status === 404) {
        setErrorType('404');
        setErrorMessage('Không tìm thấy thông tin vé phù hợp với mã đặt vé.');
      } else {
        setErrorType('500');
        setErrorMessage(err?.message || 'Đã có lỗi hệ thống xảy ra trong quá trình truy vấn vé.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetailData();
  }, [fetchDetailData]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '0đ';
    return Number(val).toLocaleString('vi-VN') + 'đ';
  };

  const formatShowtimeDateTime = (isoString) => {
    if (!isoString) return { time: '--:--', date: '----' };
    const d = new Date(isoString);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const daysInVietnamese = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = daysInVietnamese[d.getDay()];
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      time,
      date: `${dayName} - ${dateStr}`,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper lấy mã QR duy nhất cho Booking
  const getSingleBookingQr = () => {
    if (ticketData?.tickets && ticketData.tickets.length > 0 && ticketData.tickets[0].qrCodeUrl) {
      return ticketData.tickets[0].qrCodeUrl;
    }
    const code = ticketData?.bookingCode || ticketData?.orderId || 'CINEMIND';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}`;
  };

  const responseCode = searchParams.get('vnp_ResponseCode');
  const isCancelled = responseCode === '24' || 
                      ticketData?.reservationStatus === 'CANCELLED' || 
                      ticketData?.paymentStatus === 'FAILED';
  const isConfirmed = !isCancelled && (ticketData?.reservationStatus === 'CONFIRMED' || ticketData?.paymentStatus === 'COMPLETED');

  return (
    <>
      {/* CSS Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-e-ticket, #printable-e-ticket * {
            visibility: visible !important;
          }
          #printable-e-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            padding: 20px !important;
            border-radius: 12px !important;
          }
          #printable-e-ticket .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
        
        {/* Loading State */}
        {isLoading && (
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-4 shadow-xl">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Đang Tải Chi Tiết Vé...</h2>
            <p className="text-xs text-slate-500">Vui lòng chờ trong giây lát để hệ thống đồng bộ dữ liệu vé từ rạp.</p>
          </div>
        )}

        {/* CANCELLED STATE: Khách hàng hủy thanh toán giữa chừng */}
        {!isLoading && isCancelled && (
          <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-amber-600 font-bold">
                Giao Dịch Đã Hủy
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Đơn hàng đã bị hủy
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Giao dịch thanh toán đã bị hủy. Ghế giữ chỗ của quý khách đã được giải phóng để phục vụ khán giả khác.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-red-600/20 cursor-pointer"
              >
                <span>Về trang chủ</span>
              </Link>
            </div>
          </div>
        )}

        {/* Error State Handling */}
        {!isLoading && !isCancelled && errorType && (
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              {errorType === '403' ? <XCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-red-600 font-bold">
                {errorType === '403' ? '403 - KHÔNG CÓ QUYỀN TRUY CẬP' : errorType === '404' ? '404 - KHÔNG TÌM THẤY ĐƠN HÀNG' : '500 - LỖI HỆ THỐNG'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {errorType === '403' ? 'Không Có Quyền Xem Vé' : 'Không Tìm Thấy Vé'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{errorMessage}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={fetchDetailData}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử Lại</span>
              </button>
              <Link
                to="/profile?tab=bookings"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-red-600/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Lịch Sử Giao Dịch</span>
              </Link>
            </div>
          </div>
        )}

        {/* Success / Detail View (Matching mau_2.png in Light Mode) */}
        {!isLoading && !errorType && !isCancelled && ticketData && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* CỘT BÊN TRÁI: XÁC NHẬN GIAO DỊCH & HỖ TRỢ */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left no-print">
              <div className="space-y-4">
                {/* Icon Check Green */}
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto lg:mx-0 text-emerald-600 shadow-md shadow-emerald-500/10">
                  {isConfirmed ? <CheckCircle2 className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12 text-amber-500" />}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {isConfirmed ? 'Giao dịch thành công' : 'Đơn hàng chưa hoàn tất'}
                </h1>

                <div className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed max-w-md mx-auto lg:mx-0">
                  <p className="font-semibold text-slate-900">Cảm ơn quý khách đã đặt vé</p>
                  <p>Quý khách vui lòng lưu lại thông tin mã vé trên màn hình để lấy vé vào xem.</p>
                  <p className="pt-2 text-xs">
                    Mọi vấn đề cần giải đáp, xin vui lòng liên hệ: <strong className="text-slate-900">024.35141791</strong> hoặc{' '}
                    <a
                      href="https://oa.zalo.me/ttcpqg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      https://oa.zalo.me/ttcpqg
                    </a>
                  </p>
                </div>
              </div>

              {/* Action Buttons Left */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="https://oa.zalo.me/ttcpqg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition flex items-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Liên hệ</span>
                </a>
                <Link
                  to="/profile?tab=bookings"
                  className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-semibold shadow-xs transition flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Lịch Sử Giao Dịch</span>
                </Link>
              </div>
            </div>

            {/* CỘT BÊN PHẢI: THẺ E-TICKET THÔNG TIN VÉ (ID printable-e-ticket - Light Mode) */}
            <div className="lg:col-span-6 flex justify-center">
              <div
                id="printable-e-ticket"
                className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden text-slate-900"
              >
                {/* Header Thẻ */}
                <div className="text-center pb-2 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Thông tin vé</h2>
                </div>

                {/* Tên phim & Định dạng */}
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-snug">
                    {ticketData.movieTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {ticketData.roomType || '2D'} {ticketData.language || 'Tiếng Việt'} {ticketData.subtitle ? `(${ticketData.subtitle})` : ''}
                  </p>
                </div>

                {/* Hàng Người Đặt & SINGLE QR CODE DUY NHẤT */}
                <div className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {/* Bên trái: Thông tin chữ */}
                  <div className="col-span-7 space-y-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Người đặt</span>
                      <strong className="text-sm font-bold text-slate-900 block truncate">{ticketData.customerName || 'Khách hàng'}</strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Mã đặt vé</span>
                      <strong className="text-sm font-bold font-mono text-slate-900 tracking-wide block">
                        {ticketData.bookingCode || ticketData.orderId}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block">Vé điện tử</span>
                      <span className="text-xs text-blue-600 font-semibold hover:underline flex items-center space-x-1 cursor-pointer">
                        <span>Link tra cứu vé</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Bên phải: 1 MÃ QR DUY NHẤT ĐẠI DIỆN CHO BOOKING */}
                  <div className="col-span-5 flex flex-col items-center justify-center">
                    <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200">
                      <img
                        src={getSingleBookingQr()}
                        alt={`QR Code ${ticketData.bookingCode}`}
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Ngày giờ chiếu */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 block">Ngày giờ</span>
                  <div className="text-2xl font-black text-red-600 font-mono leading-none">
                    {formatShowtimeDateTime(ticketData.showtimeStart).time}
                  </div>
                  <div className="text-sm font-bold text-slate-900 capitalize">
                    {formatShowtimeDateTime(ticketData.showtimeStart).date}
                  </div>
                </div>

                {/* Dòng nhắc nhở Check-in */}
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Khán giả vui lòng dùng mã này lên thẳng phòng chiếu, không cần đổi sang vé giấy.
                  </p>
                </div>

                {/* Bảng Phòng / Tầng / Số vé / Ghế */}
                <div className="border-t border-b border-slate-200 py-4 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Phòng chiếu</span>
                    <strong className="text-sm font-bold text-slate-900 block">{ticketData.roomName || '1'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Tầng</span>
                    <strong className="text-sm font-bold text-slate-900 block">2</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Số vé</span>
                    <strong className="text-sm font-bold text-slate-900 block">{ticketData.ticketCount || 1}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Ghế</span>
                    <strong className="text-sm font-bold text-slate-900 block truncate">
                      {(ticketData.seatNames || []).join(',')}
                    </strong>
                  </div>
                </div>

                {/* F&B Combo nếu có */}
                {ticketData.fnbItems && ticketData.fnbItems.length > 0 && (
                  <div className="space-y-2 text-xs border-b border-slate-200 pb-4">
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Bắp nước (F&B)</span>
                    {ticketData.fnbItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{item.productName} × {item.quantity}</span>
                        <span className="font-mono text-red-600 font-bold">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tổng tiền */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 font-semibold">Tổng tiền</span>
                  <span className="text-xl font-black font-mono text-red-600">
                    {formatCurrency(ticketData.totalAmount)}
                  </span>
                </div>

                {/* Nút Lưu vé / In vé dưới cùng */}
                <div className="pt-2 no-print">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Lưu vé</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default PaymentStatusDetail;
