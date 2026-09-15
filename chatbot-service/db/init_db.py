import logging
from sqlalchemy import inspect
from .database import engine, Base
from .models import Movie, Showtime, Theater, Room, Seat, ShowtimeSeat, Reservation, ReservedSeat, Product, User, Article, Review
from .chat_models import ChatSession, ChatMessage

logger = logging.getLogger("chatbot.init_db")

def init_chat_tables():
    """Tạo bảng chat_sessions và chat_messages trong MySQL nếu chưa tồn tại."""
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        tables_to_create = []
        if "chat_sessions" not in existing_tables:
            tables_to_create.append(ChatSession.__table__)
        if "chat_messages" not in existing_tables:
            tables_to_create.append(ChatMessage.__table__)

        if tables_to_create:
            Base.metadata.create_all(bind=engine, tables=tables_to_create)
            logger.info(f"Created chat tables: {[t.name for t in tables_to_create]}")
        else:
            logger.info("Chat tables already exist in MySQL.")
        return True
    except Exception as e:
        logger.error(f"Error initializing chat tables in MySQL: {e}")
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_chat_tables()
