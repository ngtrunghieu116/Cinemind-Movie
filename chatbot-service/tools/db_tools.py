import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from db.database import get_db
from db.models import Movie, Showtime, Theater, Room, Seat, ShowtimeSeat, Reservation, ReservedSeat, Product, OrderItem, User, Genre

logger = logging.getLogger("chatbot.tools.db")

def search_movies_sql(
    keyword: Optional[str] = None,
    genre_name: Optional[str] = None,
    status: Optional[str] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Tìm kiếm danh sách phim từ cơ sở dữ liệu hệ thống (MySQL).
    - keyword: Tên phim hoặc từ khóa liên quan
    - genre_name: Tên thể loại (ví dụ: Hành động, Hoạt hình, Kinh dị, Hài...)
    - status: 'NOW_SHOWING' (đang chiếu) hoặc 'COMING_SOON' (sắp chiếu)
    - limit: (Tùy chọn) Giới hạn số lượng phim trả về. Mặc định là None (lấy toàn bộ danh sách phù hợp mà không bị giới hạn).
    """
    with get_db() as db:
        query = db.query(Movie)

        if status:
            query = query.filter(Movie.status == status.upper())
        else:
            # Mặc định ưu tiên phim đang chiếu hoặc sắp chiếu
            query = query.filter(Movie.status.in_(["NOW_SHOWING", "COMING_SOON"]))

        if keyword:
            keyword_clean = f"%{keyword.strip()}%"
            query = query.filter(
                (Movie.title.ilike(keyword_clean)) |
                (Movie.title_en.ilike(keyword_clean)) |
                (Movie.actors.ilike(keyword_clean)) |
                (Movie.director.ilike(keyword_clean)) |
                (Movie.description.ilike(keyword_clean))
            )

        if genre_name:
            genre_clean = f"%{genre_name.strip()}%"
            query = query.filter(
                (Movie.description.ilike(genre_clean)) |
                (Movie.title.ilike(genre_clean)) |
                (Movie.genres.any(Genre.name.ilike(genre_clean)))
            )

        if limit:
            query = query.limit(limit)
        movies = query.all()

        results = []
        for m in movies:
            genres_str = ", ".join([g.name for g in m.genres]) if m.genres else ""
            results.append({
                "movie_id": m.id,
                "title": m.title,
                "title_en": m.title_en,
                "duration_minutes": m.duration,
                "age_rating": m.age_rating,
                "genres": genres_str,
                "director": m.director,
                "actors": m.actors,
                "description": m.description,
                "status": "Đang chiếu" if m.status == "NOW_SHOWING" else "Sắp chiếu",
                "release_date": m.release_date.strftime("%d/%m/%Y") if m.release_date else None,
                "poster_url": m.poster_path,
                "trailer_url": m.trailer_url
            })
        return results

def get_showtimes_sql(
    movie_id: Optional[int] = None,
    movie_title: Optional[str] = None,
    theater_id: Optional[int] = None,
    show_date: Optional[str] = None,
    time_of_day: Optional[str] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Tra cứu lịch chiếu các suất phim tại các rạp.
    - movie_id: ID của phim (nếu biết)
    - movie_title: Tên phim (nếu chưa biết ID)
    - theater_id: ID rạp (nếu muốn lọc theo rạp)
    - show_date: Ngày chiếu theo định dạng YYYY-MM-DD (múi giờ Việt Nam, mặc định là hôm nay)
    - time_of_day: (Tùy chọn) Buổi chiếu: 'sáng' / 'morning' (06:00-11:59), 'chiều' / 'afternoon' (12:00-17:59), 'tối' / 'evening' (18:00-23:59).
    - limit: (Tùy chọn) Giới hạn số lượng suất chiếu. Mặc định là None (lấy toàn bộ các suất chiếu thoả mãn điều kiện mà không bị giới hạn).
    """
    with get_db() as db:
        query = db.query(Showtime).join(Showtime.movie).join(Showtime.room).join(Room.theater)
        query = query.filter(Showtime.is_active == True, Showtime.is_online_selling == True)

        now_vn = datetime.now()

        # Xác định ngày mục tiêu (mặc định là hôm nay nếu không truyền)
        if show_date:
            try:
                target_date = datetime.strptime(show_date.strip(), "%Y-%m-%d").date()
            except ValueError:
                target_date = now_vn.date()
        else:
            target_date = now_vn.date()

        start_day = datetime.combine(target_date, datetime.min.time())
        end_day = datetime.combine(target_date, datetime.max.time())

        # Xử lý lọc theo buổi (time_of_day) nếu người dùng hỏi sáng/chiều/tối
        if time_of_day:
            tod = str(time_of_day).strip().lower()
            if any(w in tod for w in ["sáng", "morning", "sang"]):
                start_day = datetime.combine(target_date, datetime.min.time().replace(hour=6))
                end_day = datetime.combine(target_date, datetime.min.time().replace(hour=11, minute=59, second=59))
            elif any(w in tod for w in ["chiều", "afternoon", "chieu"]):
                start_day = datetime.combine(target_date, datetime.min.time().replace(hour=12))
                end_day = datetime.combine(target_date, datetime.min.time().replace(hour=17, minute=59, second=59))
            elif any(w in tod for w in ["tối", "evening", "night", "toi"]):
                start_day = datetime.combine(target_date, datetime.min.time().replace(hour=18))
                end_day = datetime.combine(target_date, datetime.max.time())

        query = query.filter(
            Showtime.start_time >= start_day,
            Showtime.start_time <= end_day
        )

        if movie_id:
            query = query.filter(Showtime.movie_id == movie_id)
        elif movie_title:
            query = query.filter(Movie.title.ilike(f"%{movie_title.strip()}%"))

        if theater_id:
            query = query.filter(Room.theater_id == theater_id)

        query = query.order_by(Showtime.start_time.asc())
        if limit:
            query = query.limit(limit)
        showtimes = query.all()

        results = []
        for s in showtimes:
            local_start = s.start_time
            local_end = s.end_time if s.end_time else (local_start + timedelta(minutes=110))
            results.append({
                "showtime_id": s.id,
                "movie_id": s.movie.id,
                "movie_title": s.movie.title,
                "theater_name": s.room.theater.name,
                "room_name": s.room.name,
                "room_type": s.room.room_type,
                "start_time": local_start.strftime("%d/%m/%Y %H:%M"),
                "end_time": local_end.strftime("%H:%M"),
                "price_standard": float(s.price_standard),
                "price_vip": float(s.price_vip),
                "price_couple": float(s.price_couple)
            })
        return results

def get_available_seats_sql(showtime_id: int) -> Dict[str, Any]:
    """Kiểm tra sơ đồ ghế và tình trạng ghế trống (AVAILABLE, HELD, SOLD) của một suất chiếu.
    - showtime_id: ID của suất chiếu
    """
    with get_db() as db:
        showtime = db.query(Showtime).filter(Showtime.id == showtime_id).first()
        if not showtime:
            return {"error": f"Không tìm thấy suất chiếu với ID: {showtime_id}"}

        showtime_seats = (
            db.query(ShowtimeSeat)
            .join(ShowtimeSeat.seat)
            .filter(ShowtimeSeat.showtime_id == showtime_id)
            .order_by(Seat.row_name.asc(), Seat.seat_number.asc())
            .all()
        )

        total_seats = len(showtime_seats)
        available_seats = []
        occupied_seats = []

        for ss in showtime_seats:
            seat_info = {
                "seat_id": ss.seat.id,
                "seat_name": f"{ss.seat.row_name}{ss.seat.seat_number}",
                "row": ss.seat.row_name,
                "seat_number": ss.seat.seat_number,
                "seat_type": ss.seat.seat_type,
                "price": float(ss.price),
                "status": ss.status
            }
            if ss.status == "AVAILABLE":
                available_seats.append(seat_info)
            else:
                occupied_seats.append(seat_info)

        # Gom nhóm ghế trống theo từng hàng và loại ghế để hiển thị đầy đủ, không bị thiếu hàng D, E, VIP
        seats_by_row: Dict[str, List[str]] = {}
        for s in available_seats:
            row = s["row"]
            stype = s["seat_type"]
            price_formatted = f"{int(s['price']):,}đ".replace(",", ".")
            row_key = f"Hàng {row} ({stype} - {price_formatted})"
            if row_key not in seats_by_row:
                seats_by_row[row_key] = []
            seats_by_row[row_key].append(s["seat_name"])

        # Tạo tóm tắt text sẵn sàng cho Agent đọc và phản hồi người dùng
        row_summaries = []
        for r_label, s_list in seats_by_row.items():
            row_summaries.append(f"- {r_label}: {', '.join(s_list)} (Còn {len(s_list)} ghế)")

        summary_by_type: Dict[str, Dict[str, Any]] = {}
        for s in available_seats:
            st = s["seat_type"]
            if st not in summary_by_type:
                summary_by_type[st] = {"count": 0, "price": s["price"]}
            summary_by_type[st]["count"] += 1

        local_start = showtime.start_time
        return {
            "showtime_id": showtime.id,
            "movie_title": showtime.movie.title,
            "start_time": local_start.strftime("%d/%m/%Y %H:%M"),
            "theater": showtime.room.theater.name,
            "room": showtime.room.name,
            "total_seats": total_seats,
            "available_count": len(available_seats),
            "occupied_count": len(occupied_seats),
            "summary_by_type": summary_by_type,
            "available_rows_summary": "\n".join(row_summaries),
            "available_seats_by_row": seats_by_row,
            "all_available_seat_names": [s["seat_name"] for s in available_seats],
            "available_seats": available_seats # Trả về toàn bộ danh sách ghế trống không bị cắt ngắn
        }

def get_pricing_combos_sql(category: Optional[str] = None) -> Dict[str, Any]:
    """Lấy danh sách các sản phẩm F&B (bắp ngô riêng lẻ, nước giải khát riêng lẻ, combo tiết kiệm) tại rạp.
    - category: (Tùy chọn) Lọc theo loại sản phẩm: 'COMBO' (các gói combo), 'FOOD' (bắp ngô & đồ ăn lẻ), 'DRINK' (nước ngọt & đồ uống lẻ). Để trống hoặc None để lấy toàn bộ.
    """
    with get_db() as db:
        query = db.query(Product).filter(Product.is_active == True)
        if category:
            cat_clean = category.strip().upper()
            if cat_clean in ["FOOD", "DRINK", "COMBO"]:
                query = query.filter(Product.category == cat_clean)

        products = query.order_by(Product.display_order.asc(), Product.id.asc()).all()

        combos_list = []
        food_list = []
        drink_list = []
        items = []

        for p in products:
            item = {
                "product_id": p.id,
                "name": p.name,
                "category": p.category,
                "description": p.description,
                "price": float(p.price),
                "display_price": f"{int(p.price):,}đ".replace(",", "."),
                "available_quantity": p.available_quantity,
                "type": p.type
            }
            items.append(item)
            if p.category == "COMBO":
                combos_list.append(f"- {p.name} ({item['display_price']}): {p.description}")
            elif p.category == "FOOD":
                food_list.append(f"- {p.name} ({item['display_price']}): {p.description}")
            elif p.category == "DRINK":
                drink_list.append(f"- {p.name} ({item['display_price']}): {p.description}")

        sections = []
        if combos_list:
            sections.append("🍿 **COMBO TIẾT KIỆM (KÈM BẮP + NƯỚC):**\n" + "\n".join(combos_list))
        if food_list:
            sections.append("🍿 **BẮP NGÔ & ĐỒ ĂN VẶT RIÊNG LẺ (FOOD):**\n" + "\n".join(food_list))
        if drink_list:
            sections.append("🥤 **NƯỚC NGỌT & ĐỒ UỐNG GIẢI KHÁT RIÊNG LẺ (DRINK):**\n" + "\n".join(drink_list))

        return {
            "total_items": len(items),
            "filtered_category": category,
            "menu_summary": "\n\n".join(sections),
            "items": items
        }

def get_user_booking_history_sql(user_id: int, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Xem danh sách các vé hoặc đơn đặt chỗ của người dùng hiện tại.
    - user_id: ID của người dùng
    - limit: (Tùy chọn) Giới hạn số lượng đơn gần nhất cần lấy. Mặc định là None (lấy toàn bộ danh sách đơn hàng mà không bị giới hạn).
    """
    if not user_id:
        return [{"error": "Vui lòng đăng nhập để tra cứu lịch sử đặt vé."}]

    with get_db() as db:
        query = (
            db.query(Reservation)
            .filter(Reservation.user_id == user_id)
            .order_by(Reservation.created_at.desc())
        )
        if limit:
            query = query.limit(limit)
        reservations = query.all()

        results = []
        for r in reservations:
            seat_names = [f"{rs.seat.row_name}{rs.seat.seat_number}" for rs in r.reserved_seats]
            ticket_subtotal = sum(float(rs.price) for rs in r.reserved_seats)
            order_items = [
                {
                    "item_id": oi.id,
                    "product_id": oi.product_id,
                    "name": oi.product.name if oi.product else "Combo",
                    "quantity": oi.quantity,
                    "unit_price": float(oi.unit_price),
                    "subtotal": float(oi.subtotal)
                }
                for oi in r.order_items
            ]
            fnb_subtotal = sum(item["subtotal"] for item in order_items)
            showtime_start_str = (r.showtime.start_time).strftime("%d/%m/%Y %H:%M") if (r.showtime and r.showtime.start_time) else ""
            created_at_str = r.created_at.strftime("%d/%m/%Y %H:%M") if r.created_at else None
            expires_at_str = r.expires_at.strftime("%d/%m/%Y %H:%M") if r.expires_at else None
            results.append({
                "reservation_id": r.id,
                "booking_code": r.booking_code,
                "movie_title": r.showtime.movie.title if r.showtime and r.showtime.movie else "",
                "theater_name": r.showtime.room.theater.name if r.showtime and r.showtime.room else "",
                "room_name": r.showtime.room.name if r.showtime and r.showtime.room else "",
                "showtime_start": showtime_start_str,
                "seats": ", ".join(seat_names),
                "ticket_subtotal": ticket_subtotal,
                "order_items": order_items,
                "fnb_subtotal": fnb_subtotal,
                "total_price": float(r.total_price),
                "status": r.status,
                "checkout_route": f"/payment/{r.id}" if r.status == "PENDING" else None,
                "created_at": created_at_str,
                "expires_at": expires_at_str
            })
        return results

def get_reservation_detail_sql(booking_code: str) -> Dict[str, Any]:
    """Xem thông tin chi tiết một đơn đặt vé bằng mã đặt chỗ (booking_code)."""
    with get_db() as db:
        r = db.query(Reservation).filter(Reservation.booking_code == booking_code.strip()).first()
        if not r:
            return {"error": f"Không tìm thấy đơn đặt vé với mã: {booking_code}"}

        seat_names = [f"{rs.seat.row_name}{rs.seat.seat_number}" for rs in r.reserved_seats]
        ticket_subtotal = sum(float(rs.price) for rs in r.reserved_seats)
        order_items = [
            {
                "item_id": oi.id,
                "product_id": oi.product_id,
                "name": oi.product.name if oi.product else "Combo",
                "quantity": oi.quantity,
                "unit_price": float(oi.unit_price),
                "subtotal": float(oi.subtotal)
            }
            for oi in r.order_items
        ]
        fnb_subtotal = sum(item["subtotal"] for item in order_items)
        showtime_start_str = (r.showtime.start_time).strftime("%d/%m/%Y %H:%M") if (r.showtime and r.showtime.start_time) else ""
        created_at_str = r.created_at.strftime("%d/%m/%Y %H:%M") if r.created_at else None
        expires_at_str = r.expires_at.strftime("%d/%m/%Y %H:%M") if r.expires_at else None
        return {
            "reservation_id": r.id,
            "booking_code": r.booking_code,
            "movie_title": r.showtime.movie.title if r.showtime and r.showtime.movie else "",
            "theater_name": r.showtime.room.theater.name if (r.showtime and r.showtime.room and r.showtime.room.theater) else "",
            "room_name": r.showtime.room.name if (r.showtime and r.showtime.room) else "",
            "start_time": showtime_start_str,
            "seats": ", ".join(seat_names),
            "ticket_subtotal": ticket_subtotal,
            "order_items": order_items,
            "fnb_subtotal": fnb_subtotal,
            "total_price": float(r.total_price),
            "status": r.status,
            "checkout_route": f"/payment/{r.id}" if r.status == "PENDING" else None,
            "created_at": created_at_str,
            "expires_at": expires_at_str
        }
