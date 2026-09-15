import sys
import os
import logging
from typing import Optional, List, Union, Dict, Any

# Ensure current directory is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tools.db_tools import (
    search_movies_sql,
    get_showtimes_sql,
    get_available_seats_sql,
    get_pricing_combos_sql,
    get_user_booking_history_sql,
    get_reservation_detail_sql
)
from tools.rag_tools import query_movie_knowledge_rag, search_reviews_rag
from tools.booking_tools import book_ticket, cancel_ticket
from tools.routing_tools import get_page_route

logger = logging.getLogger("chatbot.mcp_server")

try:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("cinema-mcp-server")

    # 1. SQL Database Tools
    @mcp.tool()
    def mcp_search_movies(keyword: Optional[str] = None, genre_name: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tìm kiếm phim trong cơ sở dữ liệu rạp (MySQL)."""
        return search_movies_sql(keyword=keyword, genre_name=genre_name, status=status)

    @mcp.tool()
    def mcp_get_showtimes(movie_id: Optional[int] = None, movie_title: Optional[str] = None, theater_id: Optional[int] = None, show_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tra cứu lịch chiếu các suất phim tại các rạp."""
        return get_showtimes_sql(movie_id=movie_id, movie_title=movie_title, theater_id=theater_id, show_date=show_date)

    @mcp.tool()
    def mcp_get_available_seats(showtime_id: int) -> Dict[str, Any]:
        """Xem sơ đồ ghế và tình trạng ghế trống của suất chiếu."""
        return get_available_seats_sql(showtime_id=showtime_id)

    @mcp.tool()
    def mcp_get_pricing_combos() -> List[Dict[str, Any]]:
        """Xem danh sách sản phẩm combo bắp nước tại rạp."""
        return get_pricing_combos_sql()

    @mcp.tool()
    def mcp_get_booking_history(user_id: int) -> List[Dict[str, Any]]:
        """Xem lịch sử vé đã đặt của khách hàng."""
        return get_user_booking_history_sql(user_id=user_id)

    @mcp.tool()
    def mcp_get_reservation_detail(booking_code: str) -> Dict[str, Any]:
        """Xem chi tiết đơn đặt vé bằng mã booking_code."""
        return get_reservation_detail_sql(booking_code=booking_code)

    # 2. RAG Tools (Qdrant + bge-m3 + ViRanker)
    @mcp.tool()
    def mcp_query_movie_knowledge(query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tìm kiếm thông tin tri thức về phim, nội dung cốt truyện, diễn viên, chính sách rạp qua RAG."""
        return query_movie_knowledge_rag(query=query, category=category)

    @mcp.tool()
    def mcp_search_reviews(movie_name: str) -> List[Dict[str, Any]]:
        """Tìm kiếm nhận xét và đánh giá của khán giả về phim qua RAG."""
        return search_reviews_rag(movie_name=movie_name)

    # 3. Booking & Cancel Actions
    @mcp.tool()
    def mcp_book_ticket(showtime_id: int, seat_identifiers: List[Union[str, int]], user_id: Optional[int] = None) -> Dict[str, Any]:
        """Thao tác giữ chỗ và tạo đơn đặt vé xem phim."""
        return book_ticket(showtime_id=showtime_id, seat_identifiers=seat_identifiers, user_id=user_id)

    @mcp.tool()
    def mcp_cancel_ticket(booking_code: str, user_id: Optional[int] = None, reason: Optional[str] = None) -> Dict[str, Any]:
        """Thao tác huỷ vé hoặc đơn đặt chỗ theo mã booking_code."""
        return cancel_ticket(booking_code=booking_code, user_id=user_id, reason=reason)

    # 4. Routing Navigation
    @mcp.tool()
    def mcp_get_page_route(page_type: str, id: Optional[int] = None) -> Dict[str, Any]:
        """Cung cấp route đường dẫn chính xác trên Frontend để điều hướng trang."""
        return get_page_route(page_type=page_type, id=id)

except ImportError:
    mcp = None
    logger.warning("MCP SDK not installed. Standalone MCP Server running in mock mode.")

if __name__ == "__main__":
    if mcp:
        print("Starting FastMCP cinema server on stdio...")
        mcp.run()
    else:
        print("FastMCP is not available. Please install mcp via pip.")
