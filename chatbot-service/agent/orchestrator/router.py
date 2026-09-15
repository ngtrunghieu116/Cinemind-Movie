import re
import logging
from typing import Dict, Any, List
from openai import OpenAI
from config import settings

logger = logging.getLogger("chatbot.agent.orchestrator")

ORCHESTRATOR_SYSTEM_PROMPT = """Bạn là bộ điều phối ý định (Intent Orchestrator) cho hệ thống Chatbot Rạp phim CineBot.
Nhiệm vụ của bạn là phân tích tin nhắn của người dùng kết hợp với lịch sử hội thoại để chọn ra Agent chuyên trách phù hợp nhất.

CÁC AGENT CHUYÊN TRÁCH:
1. 'DISCOVERY': Khám phá phim & Tri thức (nội dung, tóm tắt cốt truyện, diễn viên, đạo diễn, đánh giá review, bài viết sự kiện, quy định độ tuổi, chính sách rạp).
2. 'BOOKING': Lịch chiếu & Đặt vé (tra cứu các suất chiếu, hỏi hôm nay/chiều nay/tối nay có phim gì, kiểm tra ghế trống, chọn ghế ví dụ A1, B2, xem giá vé, đặt vé giữ chỗ, chọn combo bắp nước).
3. 'SUPPORT': Quản lý vé & Huỷ vé (xem danh sách vé đã đặt của tôi, tra cứu mã đơn hàng, yêu cầu huỷ vé đặt chỗ).
4. 'NAVIGATION': Điều hướng trang web (xin link đến trang phim, trang lịch chiếu, trang đặt vé, trang tài khoản).
5. 'GENERAL': Lời chào hỏi thông thường, cảm ơn, giới thiệu bản thân hoặc tạm biệt.

LƯU Ý NGỮ CẢNH:
- Nếu trước đó trợ lý hỏi người dùng về chọn ghế hoặc chọn suất chiếu, và người dùng trả lời tên ghế (như 'A1', 'B3') hoặc giờ chiếu (như '10h40', '19h') hoặc số lượng vé -> Chắc chắn là 'BOOKING'.
- Nếu trước đó là luồng kiểm tra hoặc hủy vé -> Chọn 'SUPPORT'.

ĐỊNH DẠNG ĐẦU RA:
Chỉ trả về 1 từ duy nhất trong các từ: DISCOVERY, BOOKING, SUPPORT, NAVIGATION, GENERAL.
"""

class IntentOrchestrator:
    def __init__(self):
        self.client = None
        if settings.CLOUD_API_KEY:
            self.client = OpenAI(
                api_key=settings.CLOUD_API_KEY,
                base_url=settings.CLOUD_MODEL_URL
            )

    def route_intent(self, user_message: str, chat_history: List[Dict[str, Any]] = None) -> str:
        """Xác định agent chuyên trách xử lý tin nhắn có kết hợp ngữ cảnh lịch sử hội thoại."""
        msg_lower = user_message.lower().strip()

        # 1. Trích xuất thông tin ngữ cảnh từ lịch sử hội thoại
        prior_agent = None
        prior_msgs = []
        if chat_history:
            # Lọc bỏ tin nhắn hiện tại nếu đã được lưu vào database trước đó
            prior_msgs = [h for h in chat_history if not (h.get("role") == "user" and h.get("content") == user_message)]
            for h in reversed(prior_msgs):
                if h.get("role") == "assistant" and h.get("agent_name"):
                    prior_agent = h.get("agent_name")
                    break

        # 2. Fast rule-based routing cho các từ khóa hiển nhiên
        if any(w in msg_lower for w in ["dẫn tôi", "chuyển trang", "cho tôi link", "đường dẫn đến", "mở trang", "link trang"]):
            return "NAVIGATION"

        if any(w in msg_lower for w in ["hủy vé", "huỷ vé", "vé của tôi", "lịch sử đặt vé", "đơn hàng của tôi", "mã vé", "rev-"]):
            return "SUPPORT"

        if any(w in msg_lower for w in [
            "đặt vé", "đặt cho tôi", "đặt ghế", "đặt phim", "giữ chỗ", "mua vé", 
            "suất chiếu", "lịch chiếu", "còn ghế không", "ghế trống", "giá vé", 
            "chiều nay", "tối nay", "sáng nay", "trưa nay", "hôm nay có phim", 
            "ngày mai có phim", "hôm nay chiếu", "ngày mai chiếu", "có phim gì", 
            "chiếu gì", "chiếu phim gì", "lịch phim", "suất nào", "giờ chiếu", "khung giờ",
            "bắp nước", "thêm bắp", "thêm nước", "thêm combo", "thêm món", 
            "cho tôi thêm", "cho thêm", "lấy thêm", "bổ sung bắp", "bỏ bắp", 
            "bớt bắp", "đặt thêm", "đặt tiếp", "combo solo", "combo đôi", "combo vip"
        ]):
            return "BOOKING"

        # Nhận diện mẫu tên ghế (A1, B2, ghế A1, hàng A...)
        if re.search(r'\bghế\s*[a-zA-Z]\d{1,2}\b', msg_lower) or re.search(r'^(ghế\s*)?[a-zA-Z]\d{1,2}$', msg_lower) or any(w in msg_lower for w in ["chọn ghế", "ghế này", "lấy ghế", "ghế thường", "ghế vip", "ghế đôi"]):
            return "BOOKING"

        # Nhận diện chọn size bắp nước hoặc món F&B
        if (
            re.search(r'\b(size|cỡ)\s*[smlxl]{1,2}\b', msg_lower) or
            re.search(r'^(size\s*)?[smlxl]$', msg_lower) or
            any(w in msg_lower for w in ["coca", "pepsi", "sprite", "fanta", "bắp", "bỏng", "combo", "nước suối", "dasani", "trà đào", "trà sữa"])
        ):
            return "BOOKING"

        # 3. Duy trì luồng hội thoại cho các câu trả lời ngắn / tiếp nối (dialog continuity)
        if len(msg_lower) <= 30 and prior_agent:
            if "booking" in prior_agent:
                # Nếu là tên ghế, giờ chiếu, số lượng vé, size bắp nước, hoặc đồng ý
                if (
                    re.search(r'\b[a-zA-Z]\d{1,2}\b', msg_lower) or
                    re.search(r'\b\d{1,2}(h|:)\d{2}\b', msg_lower) or
                    re.search(r'\b\d+\s*(vé|ghế)?\b', msg_lower) or
                    re.search(r'\b(size|cỡ)\s*[smlxl]{1,2}\b', msg_lower) or
                    re.search(r'^(size\s*)?[smlxl]$', msg_lower) or
                    any(w in msg_lower for w in ["size", "cỡ", "m", "l", "vừa", "lớn", "đúng", "ok", "được", "ừ", "yes", "chuẩn", "chọn", "lấy", "này", "coca", "bắp", "nước"])
                ):
                    return "BOOKING"
            elif "support" in prior_agent:
                if any(w in msg_lower for w in ["hủy", "huỷ", "rev-", "đúng", "ok", "xác nhận"]):
                    return "SUPPORT"

        if any(w in msg_lower for w in ["tóm tắt", "nội dung phim", "diễn viên", "đạo diễn", "review", "đánh giá", "độ tuổi", "bao nhiêu phút"]):
            return "DISCOVERY"

        if msg_lower in ["xin chào", "chào bạn", "hello", "hi", "cảm ơn", "cảm ơn bạn", "tạm biệt", "bạn là ai"]:
            return "GENERAL"

        # 4. Phân loại qua LLM có kèm ngữ cảnh lịch sử hội thoại gần nhất
        if self.client:
            history_prompt = ""
            if prior_msgs:
                history_prompt = "LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n"
                for h in prior_msgs[-4:]:
                    r = "Khách" if h.get("role") == "user" else f"Trợ lý ({h.get('agent_name', 'CineBot')})"
                    content_str = (h.get("content") or "")[:150].replace("\n", " ")
                    history_prompt += f"- {r}: {content_str}\n"
                history_prompt += "\n"

            try:
                response = self.client.chat.completions.create(
                    model=settings.CLOUD_MODEL_NAME,
                    messages=[
                        {"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": f"{history_prompt}TIN NHẮN MỚI CỦA NGƯỜI DÙNG: '{user_message}'\n\nHãy phân tích cả lịch sử hội thoại trên và tin nhắn mới để xác định ý định: DISCOVERY, BOOKING, SUPPORT, NAVIGATION, hay GENERAL?"
                        }
                    ],
                    temperature=0.0,
                    max_tokens=10
                )
                verdict = response.choices[0].message.content.strip().upper()
                for intent in ["BOOKING", "SUPPORT", "NAVIGATION", "DISCOVERY", "GENERAL"]:
                    if intent in verdict:
                        return intent
            except Exception as e:
                logger.error(f"Orchestrator routing error: {e}")

        # 5. Default fallback có kế thừa agent gần nhất nếu có
        if prior_agent:
            if "booking" in prior_agent:
                return "BOOKING"
            elif "support" in prior_agent:
                return "SUPPORT"

        return "DISCOVERY"

_orchestrator_instance = None

def get_orchestrator() -> IntentOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = IntentOrchestrator()
    return _orchestrator_instance
