from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, String, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(64), primary_key=True) # session_id (e.g. UUID)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), default="Cuộc trò chuyện mới")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False) # 'system', 'user', 'assistant', 'tool'
    content = Column(Text, nullable=True)
    tool_calls = Column(JSON, nullable=True) # Lưu trữ JSON danh sách tool calls nếu có
    tool_call_id = Column(String(64), nullable=True)
    agent_name = Column(String(50), nullable=True) # e.g. 'safe_guard', 'discovery_agent', 'booking_agent', etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "tool_calls": self.tool_calls,
            "tool_call_id": self.tool_call_id,
            "agent_name": self.agent_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
