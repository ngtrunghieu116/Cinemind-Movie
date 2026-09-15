import logging
from datetime import timedelta
from typing import Optional, Dict, Any, Union
from db.database import get_db
from db.models import Movie, Showtime, Reservation

logger = logging.getLogger("chatbot.tools.routing")

def get_page_route(
    page_type: str,
    id: Optional[Union[int, str]] = None,
    query_params: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Cung cấp route đường dẫn chính xác trên giao diện Frontend để hỗ trợ điều hướng người dùng.
    - page_type:
        * 'movie_detail': Trang thông tin chi tiết một phim (id là số nguyên ID của phim, ví dụ: 1)
        * 'booking': Trang chọn ghế và đặt vé của suất chiếu (id là số nguyên showtimeId, ví dụ: 28)
        * 'showtimes': Trang xem lịch chiếu phim (dẫn về /movies/{id} hoặc /movies)
        * 'payment': Trang thanh toán đơn đặt vé qua VNPAY (id là số nguyên reservationId hoặc booking_code, dẫn về /payment/{reservationId})
        * 'my_tickets': Trang danh sách vé và lịch sử đặt vé (/my-bookings)
        * 'articles': Trang tin tức / bài viết sự kiện điện ảnh (/articles)
        * 'home': Trang chủ rạp phim (/)
    - id: ID của phim hoặc suất chiếu (tự động phân giải nếu truyền slug hoặc tên)
    - query_params: Các tham số URL phụ (nếu có)
    """
    page_type_clean = (page_type or "").strip().lower()

    route = "/"
    title = "Trang chủ"
    description = "Trang chủ rạp chiếu phim CineMind"

    if page_type_clean in ["movie_detail", "movie", "phim"]:
        movie_id = None
        movie_title = None

        if id is not None:
            id_str = str(id).strip()
            if id_str.isdigit():
                movie_id = int(id_str)
            else:
                # Tự động tìm kiếm theo slug hoặc tên phim trong database
                cleaned_kw = id_str.replace("-", " ").strip()
                with get_db() as db:
                    m = db.query(Movie).filter(
                        (Movie.title.ilike(f"%{cleaned_kw}%")) |
                        (Movie.title_en.ilike(f"%{cleaned_kw}%"))
                    ).first()
                    if m:
                        movie_id = m.id
                        movie_title = m.title

        if movie_id:
            if not movie_title:
                with get_db() as db:
                    m = db.query(Movie).filter(Movie.id == movie_id).first()
                    if m:
                        movie_title = m.title

            display_name = movie_title or f"phim #{movie_id}"
            route = f"/movies/{movie_id}"
            title = f"Xem chi tiết phim {display_name}"
            description = f"Xem thông tin chi tiết, trailer và lịch chiếu của {display_name}"
        else:
            route = "/movies"
            title = "Danh sách phim"
            description = "Xem danh sách toàn bộ các bộ phim đang chiếu và sắp chiếu"

    elif page_type_clean in ["booking", "seat_selection", "dat_ve"]:
        showtime_id = None
        movie_name = None
        start_time_str = None

        if id is not None:
            id_str = str(id).strip()
            if id_str.isdigit():
                showtime_id = int(id_str)
            else:
                # Tìm suất chiếu gần nhất cho phim này
                cleaned_kw = id_str.replace("-", " ").strip()
                with get_db() as db:
                    s = (
                        db.query(Showtime)
                        .join(Showtime.movie)
                        .filter(
                            (Movie.title.ilike(f"%{cleaned_kw}%")) |
                            (Movie.title_en.ilike(f"%{cleaned_kw}%"))
                        )
                        .filter(Showtime.is_active == True)
                        .order_by(Showtime.start_time.asc())
                        .first()
                    )
                    if s:
                        showtime_id = s.id
                        movie_name = s.movie.title
                        start_time_str = s.start_time.strftime("%H:%M")

        if showtime_id:
            if not movie_name:
                with get_db() as db:
                    s = db.query(Showtime).join(Showtime.movie).filter(Showtime.id == showtime_id).first()
                    if s and s.movie:
                        movie_name = s.movie.title
                        start_time_str = s.start_time.strftime("%H:%M")

            display_title = f"Chọn ghế suất {start_time_str} ({movie_name})" if (movie_name and start_time_str) else f"Chọn ghế suất #{showtime_id}"
            route = f"/booking/{showtime_id}"
            title = display_title
            description = f"Truy cập sơ đồ ghế và tiến hành đặt vé cho suất #{showtime_id}"
        else:
            route = "/movies"
            title = "Chọn phim để xem lịch chiếu"
            description = "Vui lòng chọn một bộ phim để xem các suất chiếu và chọn ghế"

    elif page_type_clean in ["showtimes", "schedule", "lich_chieu"]:
        movie_id = None
        if id is not None:
            id_str = str(id).strip()
            if id_str.isdigit():
                movie_id = int(id_str)
            else:
                cleaned_kw = id_str.replace("-", " ").strip()
                with get_db() as db:
                    m = db.query(Movie).filter(
                        (Movie.title.ilike(f"%{cleaned_kw}%")) |
                        (Movie.title_en.ilike(f"%{cleaned_kw}%"))
                    ).first()
                    if m:
                        movie_id = m.id

        if movie_id:
            route = f"/movies/{movie_id}"
            title = f"Lịch chiếu phim #{movie_id}"
            description = "Xem tất cả các khung giờ chiếu và đặt vé"
        else:
            route = "/movies"
            title = "Lịch chiếu phim"
            description = "Xem danh sách phim và lịch chiếu"

    elif page_type_clean in ["my_tickets", "history", "bookings", "my_bookings"]:
        route = "/my-bookings"
        title = "Vé của tôi"
        description = "Xem lịch sử các vé đã đặt, mã QR vé và tình trạng đơn hàng"

    elif page_type_clean in ["articles", "news", "tin_tuc"]:
        if id and str(id).isdigit():
            route = f"/articles/{id}"
            title = f"Bài viết #{id}"
            description = f"Đọc tin tức và bài viết #{id}"
        else:
            route = "/articles"
            title = "Tin tức điện ảnh"
            description = "Xem tin khuyến mãi và sự kiện điện ảnh mới nhất"

    elif page_type_clean in ["theaters", "rap"]:
        route = "/theaters"
        title = "Hệ thống cụm rạp"
        description = "Xem danh sách địa chỉ các cụm rạp CineMind"

    elif page_type_clean in ["prices", "ticket_prices", "gia_ve"]:
        route = "/ticket-prices"
        title = "Bảng giá vé rạp"
        description = "Xem bảng giá vé tiêu chuẩn, VIP và thành viên"

    elif page_type_clean in ["food", "bap_nuoc"]:
        route = "/food-preview"
        title = "Menu bắp nước F&B"
        description = "Khám phá các combo bắp rang bơ và nước ngọt tại rạp"

    elif page_type_clean in ["payment", "checkout", "thanh_toan", "vnpay"]:
        reservation_id = None
        if id is not None:
            id_str = str(id).strip()
            if id_str.isdigit():
                reservation_id = int(id_str)
            else:
                with get_db() as db:
                    r = db.query(Reservation).filter(Reservation.booking_code == id_str).first()
                    if r:
                        reservation_id = r.id

        if reservation_id:
            route = f"/payment/{reservation_id}"
            title = f"Thanh toán đơn hàng #{reservation_id} (VNPAY)"
            description = f"Trang xác nhận đơn hàng và tiến hành thanh toán qua cổng VNPAY"
        else:
            route = "/my-bookings"
            title = "Vé của tôi"
            description = "Xem danh sách đơn đặt vé của bạn"

    # Append additional query params if any
    if query_params and isinstance(query_params, dict):
        param_strs = [f"{k}={v}" for k, v in query_params.items()]
        separator = "&" if "?" in route else "?"
        route += f"{separator}{'&'.join(param_strs)}"

    return {
        "success": True,
        "page_type": page_type_clean,
        "route": route,
        "title": title,
        "description": description,
        "action_type": "NAVIGATE"
    }
