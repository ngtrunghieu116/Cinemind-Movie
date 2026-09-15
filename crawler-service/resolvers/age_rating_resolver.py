import logging
import re

logger = logging.getLogger(__name__)

# Explicit patterns in movie title suffix (e.g., "MA TÙ-T18", "NGỌN LỬA XA XÔI-T16", "MINIONS-P")
TITLE_AGE_PATTERNS = [
    (r'(\b|[-_\(\[])(C18|T18|18\+)(\b|[-_\)\]])', 'T18'),
    (r'(\b|[-_\(\[])(C16|T16|16\+)(\b|[-_\)\]])', 'T16'),
    (r'(\b|[-_\(\[])(C13|T13|13\+)(\b|[-_\)\]])', 'T13'),
    (r'[-_]\s*(P|K)\b|[\(\[]\s*(P|K)\s*[\)\]]', 'P'),
]

# Mapping category strings to age ratings
CATEGORY_AGE_MAP = [
    (r'\b(kinh dị|horror)\b', 'T18'),
    (r'\b(tội phạm|hình sự|chiến tranh|giật gân|thriller|crime|war)\b', 'T16'),
    (r'\b(hành động|action|khoa học viễn tưởng|sci-fi|bí ẩn|mystery|tâm lý|tình cảm|drama|cổ trang|dã sử)\b', 'T13'),
    (r'\b(hoạt hình|animation|gia đình|family|hài|comedy|tài liệu|documentary)\b', 'P'),
]

# Heuristic keywords in title and description
KEYWORD_AGE_MAP = [
    (r'\b(kinh dị|ma|quỷ|ác tượng|trấn yểm|hắc ngải|án mạng|bóng ma|tà sư|sám hối|bùa yêu|chị chị em em|nguyền rủa)\b', 'T18'),
    (r'\b(buôn người|tử địa|truy sát|bạo lực|chiến tranh|trại giam|thần thám|kỳ án|clayface|sát thủ|hình sự|tội phạm|đột kích)\b', 'T16'),
    (r'\b(avengers|người nhện|dune|mandalorian|street fighter|quái thú|chiến bào|chiến binh|vũ trụ|phiêu lưu|tâm lý|tình cảm|yêu|hẹn hò)\b', 'T13'),
    (r'\b(mèo mang mũ|bò sữa bay|shrek|hoạt hình|anime|quý tử|thông gia|hài|hài hước|vui nhộn|gia đình|trẻ em)\b', 'P'),
]


class AgeRatingResolver:
    """
    Resolves the age_rating for a movie based on:
    1. Title suffix patterns (highest priority - directly from NCC classification e.g. T18, T16, T13, P, K)
    2. Category text from NCC or metadata (medium priority)
    3. Title and description keyword heuristics (fallback)
    """

    def resolve(self, title: str = "", category: str = None, description: str = "") -> str:
        """
        Returns one of: 'P', 'T13', 'T16', 'T18'
        """
        if title:
            for pattern, rating in TITLE_AGE_PATTERNS:
                if re.search(pattern, title, re.IGNORECASE):
                    logger.debug(f"[AGE_RATING] Title pattern match for '{title}': {rating}")
                    return rating

        if category and category.strip() and category.lower() != "none":
            for pattern, rating in CATEGORY_AGE_MAP:
                if re.search(pattern, category, re.IGNORECASE):
                    logger.debug(f"[AGE_RATING] Category match for '{title}' (cat='{category}'): {rating}")
                    return rating

        combined_text = f"{title} {description}".lower()
        for pattern, rating in KEYWORD_AGE_MAP:
            if re.search(pattern, combined_text, re.IGNORECASE):
                logger.debug(f"[AGE_RATING] Keyword match for '{title}': {rating}")
                return rating

        return 'P'
