from .base_agent import SpecialistAgent
from agent.prompts import SUPPORT_AGENT_PROMPT
from tools.db_tools import get_user_booking_history_sql, get_reservation_detail_sql
from tools.booking_tools import cancel_ticket, add_concessions_to_booking

class TicketSupportAgent(SpecialistAgent):
    """Agent chuyên tra cứu vé của tôi, kiểm tra đơn và huỷ vé."""
    def __init__(self):
        super().__init__(
            name="ticket_support_agent",
            system_prompt=SUPPORT_AGENT_PROMPT,
            tools=[
                get_user_booking_history_sql,
                get_reservation_detail_sql,
                add_concessions_to_booking,
                cancel_ticket
            ]
        )

_support_agent = None

def get_ticket_support_agent() -> TicketSupportAgent:
    global _support_agent
    if _support_agent is None:
        _support_agent = TicketSupportAgent()
    return _support_agent
