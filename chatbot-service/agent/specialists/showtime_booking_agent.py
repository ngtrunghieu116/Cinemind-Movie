from .base_agent import SpecialistAgent
from agent.prompts import BOOKING_AGENT_PROMPT
from tools.db_tools import get_showtimes_sql, get_available_seats_sql, get_pricing_combos_sql, search_movies_sql
from tools.booking_tools import book_ticket, add_concessions_to_booking, remove_concessions_from_booking, cancel_ticket
from tools.routing_tools import get_page_route

class ShowtimeBookingAgent(SpecialistAgent):
    """Agent chuyên tra cứu lịch chiếu, kiểm tra ghế và thực hiện đặt giữ chỗ."""
    def __init__(self):
        super().__init__(
            name="showtime_booking_agent",
            system_prompt=BOOKING_AGENT_PROMPT,
            tools=[
                get_showtimes_sql,
                get_available_seats_sql,
                get_pricing_combos_sql,
                search_movies_sql,
                book_ticket,
                add_concessions_to_booking,
                remove_concessions_from_booking,
                cancel_ticket,
                get_page_route
            ]
        )

_booking_agent = None

def get_showtime_booking_agent() -> ShowtimeBookingAgent:
    global _booking_agent
    if _booking_agent is None:
        _booking_agent = ShowtimeBookingAgent()
    return _booking_agent
