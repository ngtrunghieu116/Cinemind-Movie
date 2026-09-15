import logging
from datetime import datetime
import pytz
from typing import Optional, Dict, Any
import jwt
from config import settings
from db.database import get_db
from db.models import User

logger = logging.getLogger("chatbot.agent.context_utils")

VIETNAMESE_WEEKDAYS = {
    0: "Thứ Hai",
    1: "Thứ Ba",
    2: "Thứ Tư",
    3: "Thứ Năm",
    4: "Thứ Sáu",
    5: "Thứ Bảy",
    6: "Chủ Nhật"
}

def get_vietnam_datetime_context() -> Dict[str, Any]:
    """Lấy thông tin ngày giờ hiện tại theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)."""
    tz = pytz.timezone("Asia/Ho_Chi_Minh")
    now = datetime.now(tz)
    weekday_str = VIETNAMESE_WEEKDAYS.get(now.weekday(), "")

    formatted_str = f"{weekday_str}, ngày {now.strftime('%d/%m/%Y')}, thời gian hiện tại: {now.strftime('%H:%M:%S')}"
    return {
        "datetime_str": formatted_str,
        "date_iso": now.strftime("%Y-%m-%d"),
        "time_str": now.strftime("%H:%M"),
        "weekday": weekday_str,
        "raw": now
    }

def extract_user_context(token: Optional[str] = None, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """Giải mã token JWT hoặc truy vấn user_id từ database để lấy thông tin người dùng đang login."""
    target_user_id = user_id

    # 1. Giải mã token nếu có
    if token and not target_user_id:
        try:
            clean_token = token.replace("Bearer ", "").strip()
            # Giải mã không verify hoặc verify với secret
            payload = jwt.decode(clean_token, settings.JWT_SECRET, algorithms=["HS256", "HS512"], options={"verify_signature": False})
            target_user_id = payload.get("userId") or payload.get("sub") or payload.get("id")
        except Exception as e:
            logger.debug(f"Could not decode JWT token: {e}")

    if not target_user_id:
        return None

    # 2. Truy vấn thông tin user trong MySQL
    try:
        with get_db() as db:
            user = db.query(User).filter(User.id == target_user_id).first()
            if user:
                full_name = f"{user.first_name} {user.last_name}".strip() or user.email
                return {
                    "user_id": user.id,
                    "full_name": full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role
                }
    except Exception as e:
        logger.error(f"Error querying user from DB: {e}")

    return None

def build_enriched_context_prompt(token: Optional[str] = None, user_id: Optional[int] = None) -> str:
    """Tạo prompt ngữ cảnh ngày giờ và người dùng để gắn vào System Prompt."""
    dt_info = get_vietnam_datetime_context()
    user_info = extract_user_context(token=token, user_id=user_id)

    prompt_lines = [
        "=== THÔNG TIN NGỮ CẢNH HỆ THỐNG ===",
        f"- Thời gian thực tế tại rạp (Việt Nam): {dt_info['datetime_str']}",
        f"- Định dạng ngày hôm nay (YYYY-MM-DD): {dt_info['date_iso']}"
    ]

    if user_info:
        prompt_lines.append(
            f"- Người dùng đang đăng nhập: {user_info['full_name']} (ID: {user_info['user_id']}, SĐT: {user_info.get('phone') or 'Chưa cập nhật'}, Email: {user_info['email']})"
        )
        prompt_lines.append("- Trạng thái tài khoản: ĐÃ ĐĂNG NHẬP (Cho phép đặt vé, xem vé của tôi và huỷ vé)")

        # Kiểm tra các đơn hàng đang chờ thanh toán (PENDING) còn hiệu lực của user
        try:
            with get_db() as db:
                from db.models import Reservation
                from datetime import timedelta
                now_utc = datetime.utcnow()
                pending_revs = (
                    db.query(Reservation)
                    .filter(
                        Reservation.user_id == user_info['user_id'],
                        Reservation.status == "PENDING",
                        Reservation.expires_at > now_utc
                    )
                    .order_by(Reservation.created_at.desc())
                    .all()
                )
                if pending_revs:
                    prompt_lines.append(f"- ĐƠN HÀNG ĐANG GIỮ CHỖ CHƯA THANH TOÁN (PENDING) CỦA USER ({len(pending_revs)} đơn):")
                    for prv in pending_revs:
                        m_title = prv.showtime.movie.title if (prv.showtime and prv.showtime.movie) else "Phim"
                        st_time = prv.showtime.start_time.strftime("%H:%M %d/%m") if prv.showtime else ""
                        seats_str = ", ".join([f"{rs.seat.row_name}{rs.seat.seat_number}" for rs in prv.reserved_seats])
                        items_str = ", ".join([f"{oi.quantity}x {oi.product.name}" for oi in prv.order_items if oi.product]) or "Chưa có bắp nước"
                        rem_seconds = int((prv.expires_at - now_utc).total_seconds())
                        rem_min = max(0, rem_seconds // 60)
                        prompt_lines.append(
                            f"  * Đơn {prv.booking_code} (ID: {prv.id}): Phim '{m_title}' (Suất {prv.showtime_id} lúc {st_time}) | Ghế: [{seats_str}] | Bắp nước: [{items_str}] | Tổng tiền: {int(prv.total_price):,}đ | Còn {rem_min} phút giữ chỗ | Link thanh toán: /payment/{prv.id}"
                        )
                    prompt_lines.append("  -> HƯỚNG DẪN CHO BOT KHI KHÁCH ĐÃ CÓ ĐƠN CHƯA THANH TOÁN:")
                    prompt_lines.append("     + Nếu khách muốn thêm bắp nước / đổi combo vào đơn hiện tại: Gọi `add_concessions_to_booking` để cập nhật.")
                    prompt_lines.append("     + Nếu khách muốn đặt thêm vé mới riêng biệt: Gọi `book_ticket` với ghế mới (hệ thống sẽ giữ cả 2 đơn).")
                    prompt_lines.append("     + Nếu khách muốn hủy đơn: Gọi `cancel_ticket` với mã booking_code tương ứng.")
        except Exception as e:
            logger.error(f"Error querying pending reservations for context: {e}")
    else:
        prompt_lines.append(
            "- Trạng thái tài khoản: KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP). "
            "Nếu người dùng muốn đặt vé hoặc xem vé cá nhân, bạn có thể giải thích lịch chiếu/giá vé và nhắc họ đăng nhập."
        )

    prompt_lines.append("===================================")
    return "\n".join(prompt_lines)
