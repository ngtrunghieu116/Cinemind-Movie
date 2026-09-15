from .base_agent import SpecialistAgent
from agent.prompts import NAVIGATION_AGENT_PROMPT
from tools.routing_tools import get_page_route
from tools.db_tools import search_movies_sql

class NavigationAgent(SpecialistAgent):
    """Agent chuyên điều hướng đường dẫn frontend và cung cấp route link."""
    def __init__(self):
        super().__init__(
            name="navigation_agent",
            system_prompt=NAVIGATION_AGENT_PROMPT,
            tools=[get_page_route, search_movies_sql]
        )

_nav_agent = None

def get_navigation_agent() -> NavigationAgent:
    global _nav_agent
    if _nav_agent is None:
        _nav_agent = NavigationAgent()
    return _nav_agent
