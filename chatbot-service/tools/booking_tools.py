import json
import logging
import re
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Union, Optional, Dict, Any
from db.database import get_db
from db.models import Showtime, ShowtimeSeat, Seat, Reservation, ReservedSeat, User, Product, OrderItem

logger = logging.getLogger("chatbot.tools.booking")

def _find_matching_product(query: str, products: List[Product]) -> Optional[Product]:
    """Tìm kiếm thông minh sản phẩm bắp nước/combo theo tên hoặc từ khóa."""
    if not query or not str(query).strip():
        return None
    q = str(query).strip().lower()

    # 1. Khớp chính xác hoàn toàn
    for p in products:
        if p.name.lower() == q:
            return p

    # 2. Phân tích token và kích thước (size M, size L)
    q_clean = re.sub(r'[\(\)\,\-\.\:\/]', ' ', q)
    q_tokens = set(q_clean.split())

    STOPWORDS = {"rạp", "phim", "cinema", "size", "món", "của", "và", "ở", "tại", "cho", "loại", "vị"}
    core_q_tokens = q_tokens - STOPWORDS
    if not core_q_tokens:
        return None

    wants_size_m = 'm' in q_tokens or 'size m' in q_clean or 'nhỏ' in q_clean or 'nho' in q_tokens or 'vừa' in q_clean or 'vua' in q_tokens
    wants_size_l = 'l' in q_tokens or 'size l' in q_clean or 'lớn' in q_clean or 'lon' in q_tokens or 'to' in q_clean

    best_prod = None
    best_score = 0

    for p in products:
        p_name_low = p.name.lower()
        p_clean = re.sub(r'[\(\)\,\-\.\:\/]', ' ', p_name_low)
        p_tokens = set(p_clean.split())
        core_p_tokens = p_tokens - STOPWORDS

        common = core_q_tokens.intersection(core_p_tokens)
        if not common and q not in p_name_low and p_name_low not in q:
            continue

        score = len(common) * 3

        if q in p_name_low or p_name_low in q:
            score += 4

        is_p_m = 'm' in p_tokens or 'size m' in p_clean
        is_p_l = 'l' in p_tokens or 'size l' in p_clean

        if wants_size_m:
            if is_p_m:
                score += 5
            elif is_p_l:
                score -= 3
        elif wants_size_l:
            if is_p_l:
                score += 5
            elif is_p_m:
                score -= 3

        if score > best_score:
            best_score = score
            best_prod = p

    return best_prod if best_score >= 3 else None

def book_ticket(
    showtime_id: int,
    seat_identifiers: Union[List[Union[str, int]], str, int],
    combos: Optional[Union[List[Dict[str, Any]], str, Dict[str, Any]]] = None,
    user_id: Optional[Union[int, str]] = None
) -> Dict[str, Any]:
    """Thao tác giữ chỗ và tạo đơn đặt vé (Reservation) kèm bắp nước/combo cho người dùng.
    - showtime_id: ID của suất chiếu muốn đặt
    - seat_identifiers: Danh sách tên ghế (ví dụ ['A1', 'A2']) hoặc danh sách ID ghế (ví dụ [10, 11])
    - combos: (Tùy chọn) Danh sách combo bắp nước hoặc món ăn uống muốn đặt kèm (ví dụ: [{'name': 'Combo Đôi', 'quantity': 1}] hoặc [{'product_id': 2, 'quantity': 1}])
    - user_id: ID của người dùng đã đăng nhập (nếu chưa đăng nhập sẽ yêu cầu đăng nhập)
    """
    # Chuẩn hóa user_id và showtime_id nếu LLM truyền dạng chuỗi
    if user_id is not None and str(user_id).strip().isdigit():
        user_id = int(str(user_id).strip())

    if showtime_id is not None and str(showtime_id).strip().isdigit():
        showtime_id = int(str(showtime_id).strip())

    # Chuẩn hóa danh sách ghế: hỗ trợ JSON array string '["A2"]', chuỗi 'A2', phẩy 'A1, A2' hoặc list
    raw_seats = seat_identifiers
    if isinstance(raw_seats, (str, int)):
        raw_seats = [raw_seats]

    cleaned_identifiers = []
    for item in (raw_seats or []):
        if isinstance(item, str):
            clean_str = item.strip()
            if clean_str.startswith("[") and clean_str.endswith("]"):
                try:
                    parsed = json.loads(clean_str)
                    if isinstance(parsed, list):
                        cleaned_identifiers.extend(parsed)
                    else:
                        cleaned_identifiers.append(parsed)
                except Exception:
                    inner = clean_str[1:-1].strip()
                    cleaned_identifiers.extend([x.strip().strip("'\"") for x in inner.split(",") if x.strip()])
            elif "," in clean_str:
                cleaned_identifiers.extend([x.strip() for x in clean_str.split(",") if x.strip()])
            else:
                cleaned_identifiers.append(clean_str)
        else:
            cleaned_identifiers.append(item)

    seat_identifiers = [x for x in cleaned_identifiers if str(x).strip()]

    # Chuẩn hóa combos: hỗ trợ None, JSON string, single dict hoặc list
    parsed_combos: List[Dict[str, Any]] = []
    if combos:
        raw_c = combos
        if isinstance(raw_c, str):
            clean_c = raw_c.strip()
            if clean_c.startswith("{") or clean_c.startswith("["):
                try:
                    loaded = json.loads(clean_c)
                    if isinstance(loaded, list):
                        parsed_combos.extend(loaded)
                    elif isinstance(loaded, dict):
                        parsed_combos.append(loaded)
                except Exception:
                    pass
            if not parsed_combos and clean_c:
                parsed_combos.append({"name": clean_c, "quantity": 1})
        elif isinstance(raw_c, dict):
            parsed_combos.append(raw_c)
        elif isinstance(raw_c, list):
            parsed_combos.extend(raw_c)

    if not user_id:
        return {
            "success": False,
            "error_code": "AUTH_REQUIRED",
            "message": "Bạn cần đăng nhập tài khoản trước khi thực hiện đặt vé qua Chatbot. Vui lòng đăng nhập hoặc truy cập trang đặt vé trực tiếp."
        }

    if not seat_identifiers:
        return {
            "success": False,
            "error_code": "EMPTY_SEATS",
            "message": "Danh sách ghế đặt không được để trống."
        }

    with get_db() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "success": False,
                "error_code": "USER_NOT_FOUND",
                "message": f"Không tìm thấy thông tin tài khoản người dùng với ID: {user_id}."
            }

        showtime = db.query(Showtime).filter(Showtime.id == showtime_id).first()
        if not showtime:
            return {
                "success": False,
                "error_code": "SHOWTIME_NOT_FOUND",
                "message": f"Không tìm thấy suất chiếu với ID: {showtime_id}."
            }

        now_vn = datetime.now()
        now_utc = datetime.utcnow()
        if showtime.start_time <= now_vn:
            return {
                "success": False,
                "error_code": "SHOWTIME_EXPIRED",
                "message": f"Suất chiếu [Mã {showtime.id}] (chiếu lúc {showtime.start_time.strftime('%H:%M ngày %d/%m/%Y')}) đã bắt đầu hoặc đã qua giờ chiếu."
            }

        # Tìm các showtime_seats tương ứng
        query = (
            db.query(ShowtimeSeat)
            .join(ShowtimeSeat.seat)
            .filter(ShowtimeSeat.showtime_id == showtime_id)
        )

        # Hỗ trợ cả tên ghế ('A1', 'B5') lẫn ID (12, 13)
        seat_names = [str(s).strip().upper() for s in seat_identifiers if not str(s).isdigit()]
        seat_ids = [int(s) for s in seat_identifiers if str(s).isdigit()]

        matched_showtime_seats: List[ShowtimeSeat] = []

        all_showtime_seats = query.all()
        for ss in all_showtime_seats:
            name = f"{ss.seat.row_name}{ss.seat.seat_number}".upper()
            if ss.seat_id in seat_ids or name in seat_names:
                matched_showtime_seats.append(ss)

        if len(matched_showtime_seats) != len(seat_identifiers):
            return {
                "success": False,
                "error_code": "SEATS_NOT_FOUND",
                "message": f"Một số ghế yêu cầu không tồn tại trong suất chiếu này (Tìm thấy {len(matched_showtime_seats)}/{len(seat_identifiers)} ghế)."
            }

        # Kiểm tra trạng thái ghế
        for ss in matched_showtime_seats:
            seat_display = f"{ss.seat.row_name}{ss.seat.seat_number}"
            if ss.status == "SOLD":
                return {
                    "success": False,
                    "error_code": "SEAT_SOLD",
                    "message": f"Ghế {seat_display} đã được bán. Vui lòng chọn ghế khác."
                }
            if ss.status == "HELD" and ss.locked_until and ss.locked_until > now_utc:
                if ss.held_by_user_id != user.id:
                    return {
                        "success": False,
                        "error_code": "SEAT_HELD",
                        "message": f"Ghế {seat_display} đang được người khác giữ chỗ. Vui lòng chọn ghế khác."
                    }

        # Tính tổng tiền vé và giữ chỗ 10 phút (lưu UTC vào DB, hiển thị giờ VN)
        hold_minutes = 10
        locked_until_utc = now_utc + timedelta(minutes=hold_minutes)
        locked_until_vn = locked_until_utc + timedelta(hours=7)
        hold_token = str(uuid.uuid4())
        ticket_subtotal = Decimal("0.00")

        for ss in matched_showtime_seats:
            ticket_subtotal += ss.price
            ss.status = "HELD"
            ss.hold_token = hold_token
            ss.held_by_user_id = user.id
            ss.locked_until = locked_until_utc

        booking_code = f"REV-{int(now_utc.timestamp())}-{str(uuid.uuid4())[:4].upper()}"

        # Nếu đơn mới đặt lại các ghế mà user đang giữ trong đơn PENDING cũ -> Hủy đơn cũ để thay thế bằng đơn mới
        matched_seat_ids = [ss.seat_id for ss in matched_showtime_seats]
        old_pendings = (
            db.query(Reservation)
            .join(ReservedSeat, ReservedSeat.reservation_id == Reservation.id)
            .filter(
                Reservation.user_id == user.id,
                Reservation.showtime_id == showtime.id,
                Reservation.status == "PENDING",
                ReservedSeat.seat_id.in_(matched_seat_ids)
            )
            .all()
        )
        for op in old_pendings:
            op.status = "CANCELLED"

        reservation = Reservation(
            booking_code=booking_code,
            user_id=user.id,
            showtime_id=showtime.id,
            total_price=ticket_subtotal, # Tạm tính vé, sẽ cộng thêm combo ở dưới
            status="PENDING",
            created_at=now_utc,
            expires_at=locked_until_utc
        )
        db.add(reservation)
        db.flush() # Để lấy reservation.id

        reserved_seats_list = []
        for ss in matched_showtime_seats:
            ss.reservation_id = reservation.id
            rs = ReservedSeat(
                reservation_id=reservation.id,
                seat_id=ss.seat_id,
                price=ss.price
            )
            reserved_seats_list.append(rs)
        db.add_all(reserved_seats_list)

        # Xử lý các món combo bắp nước nếu có đặt kèm
        booked_combos = []
        fnb_subtotal = Decimal("0.00")
        if parsed_combos:
            all_active_products = db.query(Product).filter(Product.is_active == True).all()
            for c_entry in parsed_combos:
                if isinstance(c_entry, str):
                    c_name = c_entry.strip()
                    c_qty = 1
                    c_pid = None
                elif isinstance(c_entry, dict):
                    c_pid = c_entry.get("product_id") or c_entry.get("id")
                    c_name = c_entry.get("name") or c_entry.get("combo_name") or c_entry.get("product_name") or c_entry.get("item")
                    c_qty = c_entry.get("quantity") or c_entry.get("qty") or c_entry.get("count") or 1
                else:
                    continue

                try:
                    c_qty = int(c_qty)
                    if c_qty <= 0:
                        continue
                except Exception:
                    c_qty = 1

                # Tìm kiếm sản phẩm phù hợp trong DB
                matched_prod = None
                if c_pid:
                    try:
                        c_pid_int = int(c_pid)
                        for p in all_active_products:
                            if p.id == c_pid_int:
                                matched_prod = p
                                break
                    except Exception:
                        pass

                if not matched_prod and c_name:
                    matched_prod = _find_matching_product(c_name, all_active_products)

                if matched_prod:
                    unit_price = matched_prod.price
                    subtotal = unit_price * Decimal(str(c_qty))
                    fnb_subtotal += subtotal
                    order_item = OrderItem(
                        reservation_id=reservation.id,
                        product_id=matched_prod.id,
                        quantity=c_qty,
                        unit_price=unit_price,
                        subtotal=subtotal
                    )
                    db.add(order_item)
                    booked_combos.append({
                        "product_id": matched_prod.id,
                        "name": matched_prod.name,
                        "quantity": c_qty,
                        "unit_price": float(unit_price),
                        "subtotal": float(subtotal)
                    })

        total_price = ticket_subtotal + fnb_subtotal
        reservation.total_price = total_price
        db.commit()

        booked_seat_names = [f"{ss.seat.row_name}{ss.seat.seat_number}" for ss in matched_showtime_seats]
        local_start = showtime.start_time + timedelta(hours=7)

        combo_summary_str = ""
        if booked_combos:
            combo_parts = [f"{c['quantity']}x {c['name']}" for c in booked_combos]
            combo_summary_str = f" kèm bắp nước ({', '.join(combo_parts)})"

        total_formatted = f"{int(total_price):,}đ".replace(",", ".")
        ticket_formatted = f"{int(ticket_subtotal):,}đ".replace(",", ".")
        fnb_formatted = f"{int(fnb_subtotal):,}đ".replace(",", ".")

        return {
            "success": True,
            "booking_code": booking_code,
            "reservation_id": reservation.id,
            "showtime_id": showtime.id,
            "movie_title": showtime.movie.title,
            "theater_name": showtime.room.theater.name,
            "room_name": showtime.room.name,
            "start_time": local_start.strftime("%d/%m/%Y %H:%M"),
            "seats": booked_seat_names,
            "combos": booked_combos,
            "ticket_subtotal": float(ticket_subtotal),
            "fnb_subtotal": float(fnb_subtotal),
            "total_price": float(total_price),
            "status": "PENDING",
            "expires_at": locked_until_vn.strftime("%H:%M:%S"),
            "checkout_route": f"/payment/{reservation.id}",
            "payment_url": f"/payment/{reservation.id}",
            "message": f"Đặt giữ chỗ thành công cho {len(booked_seat_names)} ghế ({', '.join(booked_seat_names)}){combo_summary_str}. Tổng tiền: {total_formatted} (Vé: {ticket_formatted}{f', Bắp nước: {fnb_formatted}' if fnb_subtotal > 0 else ''}). Đơn hàng được giữ trong {hold_minutes} phút. Vui lòng thanh toán qua VNPAY trước {locked_until_vn.strftime('%H:%M:%S')} tại: /payment/{reservation.id}."
        }

def add_concessions_to_booking(
    combos: Union[List[Dict[str, Any]], str, Dict[str, Any]],
    booking_code: Optional[str] = None,
    reservation_id: Optional[Union[int, str]] = None,
    user_id: Optional[Union[int, str]] = None
) -> Dict[str, Any]:
    """Bổ sung thêm bắp rang bơ, nước ngọt hoặc combo vào một đơn đặt vé đang chờ thanh toán (PENDING).
    - combos: Danh sách bắp nước muốn thêm (ví dụ: [{'name': 'Bắp Phô Mai (Size L)', 'quantity': 1}, {'name': 'Coca-Cola (Size L 32oz)', 'quantity': 2}])
    - booking_code: Mã đặt vé (ví dụ: 'REV-1788581198-7FDB'). Nếu không truyền, hệ thống sẽ tự tìm đơn PENDING gần nhất của user.
    - reservation_id: ID đơn đặt vé (nếu biết).
    - user_id: ID người dùng (bắt buộc).
    """
    if user_id is not None and str(user_id).strip().isdigit():
        user_id = int(str(user_id).strip())

    if not user_id:
        return {
            "success": False,
            "error_code": "AUTH_REQUIRED",
            "message": "Bạn cần đăng nhập tài khoản trước khi thực hiện thêm bắp nước vào đơn hàng."
        }

    # Chuẩn hóa combos: hỗ trợ None, JSON string, single dict hoặc list
    parsed_combos: List[Dict[str, Any]] = []
    if combos:
        raw_c = combos
        if isinstance(raw_c, str):
            clean_c = raw_c.strip()
            if clean_c.startswith("{") or clean_c.startswith("["):
                try:
                    loaded = json.loads(clean_c)
                    if isinstance(loaded, list):
                        parsed_combos.extend(loaded)
                    elif isinstance(loaded, dict):
                        parsed_combos.append(loaded)
                except Exception:
                    pass
            if not parsed_combos and clean_c:
                parsed_combos.append({"name": clean_c, "quantity": 1})
        elif isinstance(raw_c, dict):
            parsed_combos.append(raw_c)
        elif isinstance(raw_c, list):
            parsed_combos.extend(raw_c)

    if not parsed_combos:
        return {
            "success": False,
            "error_code": "EMPTY_COMBOS",
            "message": "Vui lòng chọn món bắp nước hoặc combo cần thêm."
        }

    with get_db() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "success": False,
                "error_code": "USER_NOT_FOUND",
                "message": f"Không tìm thấy tài khoản người dùng với ID: {user_id}."
            }

        now_utc = datetime.utcnow()

        # Tìm đơn hàng mục tiêu
        query = db.query(Reservation).filter(Reservation.user_id == user.id)
        if reservation_id:
            query = query.filter(Reservation.id == int(reservation_id))
        elif booking_code:
            query = query.filter(Reservation.booking_code == booking_code.strip())
        else:
            query = query.filter(Reservation.status == "PENDING").order_by(Reservation.created_at.desc())

        reservation = query.first()
        if not reservation:
            return {
                "success": False,
                "error_code": "RESERVATION_NOT_FOUND",
                "message": "Không tìm thấy đơn đặt vé nào đang chờ thanh toán của bạn để bổ sung bắp nước. Bạn có thể đặt vé mới nhé!"
            }

        if reservation.status != "PENDING":
            return {
                "success": False,
                "error_code": "RESERVATION_NOT_MODIFIABLE",
                "message": f"Đơn hàng {reservation.booking_code} đang ở trạng thái {reservation.status}, không thể thay đổi bắp nước."
            }

        if reservation.expires_at and reservation.expires_at <= now_utc:
            reservation.status = "EXPIRED"
            # Giải phóng ghế
            for ss in reservation.showtime_seats:
                ss.status = "AVAILABLE"
                ss.hold_token = None
                ss.held_by_user_id = None
                ss.locked_until = None
                ss.reservation_id = None
            db.commit()
            return {
                "success": False,
                "error_code": "RESERVATION_EXPIRED",
                "message": f"Đơn hàng {reservation.booking_code} đã hết hạn giữ chỗ (10 phút). Ghế đã được giải phóng, vui lòng tiến hành đặt vé mới."
            }

        # Tìm sản phẩm trong DB
        all_products = db.query(Product).filter(Product.is_active == True).all()
        added_items_summary = []
        for c_req in parsed_combos:
            p_id = c_req.get("product_id") or c_req.get("id")
            p_name = c_req.get("name") or c_req.get("title") or ""
            qty = max(1, int(c_req.get("quantity", 1)))

            matched_prod = None
            if p_id:
                matched_prod = next((p for p in all_products if p.id == int(p_id)), None)
            if not matched_prod and p_name:
                matched_prod = _find_matching_product(p_name, all_products)

            if not matched_prod:
                return {
                    "success": False,
                    "error_code": "PRODUCT_NOT_FOUND",
                    "message": f"Không tìm thấy sản phẩm bắp nước phù hợp với yêu cầu: '{p_name or p_id}'. Vui lòng xem menu bắp nước để chọn món khả dụng."
                }

            # Kiểm tra xem sản phẩm đã có trong đơn hàng chưa (cộng dồn số lượng)
            existing_oi = next((oi for oi in reservation.order_items if oi.product_id == matched_prod.id), None)
            if existing_oi:
                existing_oi.quantity += qty
                existing_oi.subtotal = existing_oi.unit_price * existing_oi.quantity
            else:
                new_oi = OrderItem(
                    reservation_id=reservation.id,
                    product_id=matched_prod.id,
                    unit_price=matched_prod.price,
                    quantity=qty,
                    subtotal=matched_prod.price * qty
                )
                db.add(new_oi)

            added_items_summary.append(f"{qty}x {matched_prod.name}")

        # Tính lại tổng tiền của đơn hàng
        db.flush()
        all_order_items = db.query(OrderItem).filter(OrderItem.reservation_id == reservation.id).all()
        ticket_subtotal = sum(rs.price for rs in reservation.reserved_seats)
        fnb_subtotal = sum(oi.subtotal for oi in all_order_items)
        total_price = ticket_subtotal + fnb_subtotal
        reservation.total_price = total_price

        db.commit()

        # Format kết quả trả về
        all_items_str = ", ".join([f"{oi.quantity}x {oi.product.name if oi.product else 'Món'}" for oi in all_order_items])
        booked_seat_names = [f"{rs.seat.row_name}{rs.seat.seat_number}" for rs in reservation.reserved_seats]
        movie_title = reservation.showtime.movie.title if (reservation.showtime and reservation.showtime.movie) else "Phim"
        showtime_str = reservation.showtime.start_time.strftime("%H:%M ngày %d/%m/%Y") if reservation.showtime else ""
        expires_vn = (reservation.expires_at + timedelta(hours=7)).strftime("%H:%M:%S") if reservation.expires_at else ""

        total_formatted = f"{int(total_price):,}đ".replace(",", ".")
        ticket_formatted = f"{int(ticket_subtotal):,}đ".replace(",", ".")
        fnb_formatted = f"{int(fnb_subtotal):,}đ".replace(",", ".")

        return {
            "success": True,
            "action": "CONCESSIONS_ADDED",
            "booking_code": reservation.booking_code,
            "reservation_id": reservation.id,
            "movie_title": movie_title,
            "showtime": showtime_str,
            "seats": booked_seat_names,
            "added_items": added_items_summary,
            "all_order_items": [
                {
                    "item_id": oi.id,
                    "product_id": oi.product_id,
                    "name": oi.product.name if oi.product else "Món",
                    "quantity": oi.quantity,
                    "unit_price": float(oi.unit_price),
                    "subtotal": float(oi.subtotal)
                }
                for oi in all_order_items
            ],
            "ticket_subtotal": float(ticket_subtotal),
            "fnb_subtotal": float(fnb_subtotal),
            "total_price": float(total_price),
            "checkout_route": f"/payment/{reservation.id}",
            "expires_at": expires_vn,
            "message": (
                f"Đã bổ sung thành công ({', '.join(added_items_summary)}) vào đơn hàng {reservation.booking_code}. "
                f"Tổng đơn hàng hiện tại: {total_formatted} (Vé: {ticket_formatted}, Bắp nước: {fnb_formatted}). "
                f"Toàn bộ bắp nước trong đơn: [{all_items_str}]. "
                f"Vui lòng thanh toán trước {expires_vn} tại: /payment/{reservation.id}."
            )
        }

def remove_concessions_from_booking(
    item_name: str,
    booking_code: Optional[str] = None,
    reservation_id: Optional[Union[int, str]] = None,
    user_id: Optional[Union[int, str]] = None
) -> Dict[str, Any]:
    """Xóa bỏ hoặc giảm bớt một món bắp nước / combo khỏi đơn đặt vé đang chờ thanh toán (PENDING).
    - item_name: Tên món bắp nước muốn xóa (ví dụ: 'Bắp Ngọt', 'Combo Solo', 'Coca')
    - booking_code: Mã đặt vé (nếu có). Nếu không truyền sẽ lấy đơn PENDING gần nhất của user.
    - reservation_id: ID đơn hàng (nếu có).
    - user_id: ID người dùng.
    """
    if user_id is not None and str(user_id).strip().isdigit():
        user_id = int(str(user_id).strip())

    if not user_id:
        return {
            "success": False,
            "error_code": "AUTH_REQUIRED",
            "message": "Bạn cần đăng nhập tài khoản trước khi thực hiện thao tác."
        }

    with get_db() as db:
        query = db.query(Reservation).filter(Reservation.user_id == user_id)
        if reservation_id:
            query = query.filter(Reservation.id == int(reservation_id))
        elif booking_code:
            query = query.filter(Reservation.booking_code == booking_code.strip())
        else:
            query = query.filter(Reservation.status == "PENDING").order_by(Reservation.created_at.desc())

        reservation = query.first()
        if not reservation or reservation.status != "PENDING":
            return {
                "success": False,
                "error_code": "RESERVATION_NOT_FOUND",
                "message": "Không tìm thấy đơn hàng đang chờ thanh toán phù hợp."
            }

        # Tìm item cần xóa trong reservation.order_items
        q_clean = item_name.strip().lower()
        target_oi = None
        for oi in reservation.order_items:
            if oi.product and (q_clean in oi.product.name.lower() or oi.product.name.lower() in q_clean):
                target_oi = oi
                break

        if not target_oi:
            return {
                "success": False,
                "error_code": "ITEM_NOT_IN_ORDER",
                "message": f"Không tìm thấy món '{item_name}' trong đơn hàng {reservation.booking_code}."
            }

        removed_name = target_oi.product.name if target_oi.product else "Món"
        db.delete(target_oi)
        db.flush()

        all_order_items = db.query(OrderItem).filter(OrderItem.reservation_id == reservation.id).all()
        ticket_subtotal = sum(rs.price for rs in reservation.reserved_seats)
        fnb_subtotal = sum(oi.subtotal for oi in all_order_items)
        total_price = ticket_subtotal + fnb_subtotal
        reservation.total_price = total_price
        db.commit()

        total_formatted = f"{int(total_price):,}đ".replace(",", ".")
        return {
            "success": True,
            "booking_code": reservation.booking_code,
            "reservation_id": reservation.id,
            "removed_item": removed_name,
            "total_price": float(total_price),
            "ticket_subtotal": float(ticket_subtotal),
            "fnb_subtotal": float(fnb_subtotal),
            "message": f"Đã xóa món '{removed_name}' khỏi đơn hàng {reservation.booking_code}. Tổng tiền mới của đơn hàng là: {total_formatted}."
        }

def cancel_ticket(
    booking_code: str,
    user_id: Optional[int] = None,
    reason: Optional[str] = None
) -> Dict[str, Any]:
    """Thao tác huỷ vé hoặc đơn đặt chỗ theo mã đặt chỗ (booking_code).
    - booking_code: Mã đặt vé (ví dụ: REV-1725450000-A1B2)
    - user_id: ID người dùng yêu cầu huỷ
    - reason: Lý do huỷ (tùy chọn)
    """
    if not booking_code or not booking_code.strip():
        return {
            "success": False,
            "message": "Vui lòng cung cấp mã đặt chỗ (booking_code) cần huỷ."
        }

    with get_db() as db:
        reservation = db.query(Reservation).filter(Reservation.booking_code == booking_code.strip()).first()
        if not reservation:
            return {
                "success": False,
                "message": f"Không tìm thấy đơn hàng với mã đặt chỗ: {booking_code}."
            }

        if user_id and reservation.user_id != user_id:
            return {
                "success": False,
                "message": "Bạn không có quyền huỷ đơn đặt vé của người khác."
            }

        if reservation.status == "CANCELLED":
            return {
                "success": True,
                "message": f"Đơn đặt vé {booking_code} trước đó đã bị huỷ."
            }

        if reservation.status == "EXPIRED":
            return {
                "success": True,
                "message": f"Đơn đặt vé {booking_code} đã hết hạn thanh toán và tự động giải phóng ghế."
            }

        if reservation.status == "CONFIRMED":
            return {
                "success": False,
                "status": "CONFIRMED",
                "message": (
                    f"Đơn hàng {booking_code} đã thanh toán thành công. "
                    "Theo chính sách của rạp, vé đã thanh toán không thể tự huỷ qua chatbot. "
                    "Quý khách vui lòng liên hệ quầy vé tại rạp hoặc gọi Hotline chăm sóc khách hàng trước giờ chiếu tối thiểu 60 phút để được hỗ trợ hoàn/đổi vé."
                )
            }

        # Trạng thái PENDING: Hủy ngay và giải phóng ghế
        reservation.status = "CANCELLED"

        # Giải phóng ShowtimeSeats
        showtime_seats = db.query(ShowtimeSeat).filter(ShowtimeSeat.reservation_id == reservation.id).all()
        for ss in showtime_seats:
            ss.status = "AVAILABLE"
            ss.hold_token = None
            ss.held_by_user_id = None
            ss.locked_until = None
            ss.reservation_id = None

        db.commit()

        return {
            "success": True,
            "booking_code": booking_code,
            "status": "CANCELLED",
            "message": f"Đã huỷ đơn đặt vé {booking_code} thành công. Toàn bộ ghế đã được giải phóng."
        }
