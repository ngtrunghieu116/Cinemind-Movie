from .base_agent import SpecialistAgent
from agent.prompts import DISCOVERY_AGENT_PROMPT
from tools.rag_tools import query_movie_knowledge_rag, search_reviews_rag
from tools.db_tools import search_movies_sql, get_showtimes_sql

class DiscoveryAgent(SpecialistAgent):
    """Agent chuyên khám phá phim, tóm tắt, review, quy định rạp bằng RAG."""
    def __init__(self):
        super().__init__(
            name="discovery_agent",
            system_prompt=DISCOVERY_AGENT_PROMPT,
            tools=[
                query_movie_knowledge_rag,
                search_reviews_rag,
                search_movies_sql,
                get_showtimes_sql
            ]
        )

_discovery_agent = None

def get_discovery_agent() -> DiscoveryAgent:
    global _discovery_agent
    if _discovery_agent is None:
        _discovery_agent = DiscoveryAgent()
    return _discovery_agent
