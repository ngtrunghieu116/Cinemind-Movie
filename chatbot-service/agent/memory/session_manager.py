import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import or_
from db.database import get_db
from db.chat_models import ChatSession, ChatMessage
from db.models import User

logger = logging.getLogger("chatbot.agent.session_manager")

class SessionManager:
    """Quản lý phiên hội thoại và tin nhắn lưu trực tiếp vào cơ sở dữ liệu MySQL hệ thống."""

    def get_or_create_session(
        self,
        session_id: Optional[str] = None,
        user_id: Optional[int] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        with get_db() as db:
            session = None
            if session_id:
                session = db.query(ChatSession).filter(ChatSession.id == session_id).first()

            if not session:
                new_id = session_id or str(uuid.uuid4())
                session = ChatSession(
                    id=new_id,
                    user_id=user_id,
                    title=title or "Cuộc trò chuyện rạp phim",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(session)
                db.commit()
                db.refresh(session)
            elif user_id and not session.user_id:
                # Cập nhật user_id cho session nếu người dùng đăng nhập sau đó
                session.user_id = user_id
                db.commit()

            return session.to_dict()

    def add_message(
        self,
        session_id: str,
        role: str,
        content: Optional[str] = None,
        tool_calls: Optional[Any] = None,
        tool_call_id: Optional[str] = None,
        agent_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lưu một tin nhắn mới vào bảng chat_messages trong MySQL."""
        with get_db() as db:
            # Đảm bảo session tồn tại
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if not session:
                session = ChatSession(id=session_id, title="Cuộc trò chuyện mới")
                db.add(session)
                db.commit()

            msg = ChatMessage(
                session_id=session_id,
                role=role,
                content=content,
                tool_calls=tool_calls,
                tool_call_id=tool_call_id,
                agent_name=agent_name,
                created_at=datetime.utcnow()
            )
            db.add(msg)

            # Cập nhật tiêu đề session thông minh theo câu hỏi đầu tiên của người dùng
            if role == "user" and content and content.strip():
                if session.title in ["Cuộc trò chuyện rạp phim", "Cuộc trò chuyện mới", None] or not session.title:
                    clean_title = content.strip().replace("\n", " ")
                    if len(clean_title) > 40:
                        clean_title = clean_title[:40].rstrip() + "..."
                    session.title = clean_title

            # Cập nhật thời gian session
            session.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(msg)
            return msg.to_dict()

    def get_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Lấy danh sách tin nhắn mới nhất theo thứ tự thời gian kèm metadata cho cả LLM và Admin."""
        with get_db() as db:
            # Lấy N tin nhắn mới nhất (DESC) rồi đảo ngược lại để giữ đúng trình tự thời gian (ASC)
            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session_id)
                .order_by(ChatMessage.id.desc())
                .limit(limit)
                .all()
            )
            messages.reverse()

            results = []
            for m in messages:
                results.append({
                    "id": m.id,
                    "role": m.role,
                    "content": m.content or "",
                    "tool_calls": m.tool_calls,
                    "tool_call_id": m.tool_call_id,
                    "agent_name": m.agent_name,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                })
            return results

    def list_user_sessions(
        self,
        user_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 30,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Lấy danh sách tất cả các phiên chat chi tiết phục vụ người dùng và trang Admin."""
        with get_db() as db:
            if user_id is None and not (search and search.strip()):
                return {
                    "sessions": [],
                    "total": 0,
                    "stats": {
                        "total_sessions": 0,
                        "total_messages": 0,
                        "total_questions": 0
                    }
                }

            query = db.query(ChatSession)
            if user_id:
                query = query.filter(ChatSession.user_id == user_id)

            if search and search.strip():
                kw = f"%{search.strip()}%"
                matching_msg_session_ids = [
                    r[0] for r in db.query(ChatMessage.session_id)
                    .filter(ChatMessage.content.ilike(kw))
                    .distinct()
                    .all()
                ]
                query = query.filter(
                    or_(
                        ChatSession.id.ilike(kw),
                        ChatSession.title.ilike(kw),
                        ChatSession.id.in_(matching_msg_session_ids)
                    )
                )

            total = query.count()
            sessions = (
                query.order_by(ChatSession.updated_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )

            results = []
            for s in sessions:
                s_dict = s.to_dict()

                # Thông tin tài khoản người dùng nếu có
                user_info = None
                if s.user_id:
                    user_obj = db.query(User).filter(User.id == s.user_id).first()
                    if user_obj:
                        user_info = {
                            "id": user_obj.id,
                            "email": user_obj.email,
                            "first_name": user_obj.first_name,
                            "last_name": user_obj.last_name,
                            "full_name": f"{user_obj.last_name} {user_obj.first_name}".strip(),
                            "role": user_obj.role
                        }
                s_dict["user"] = user_info

                # Câu hỏi đầu tiên của người dùng
                first_user_msg = (
                    db.query(ChatMessage)
                    .filter(ChatMessage.session_id == s.id, ChatMessage.role == "user")
                    .order_by(ChatMessage.created_at.asc())
                    .first()
                )
                first_q = first_user_msg.content if first_user_msg else None
                s_dict["first_question"] = first_q
                s_dict["preview"] = (first_q[:80] + "...") if first_q and len(first_q) > 80 else (first_q or s.title)

                # Tin nhắn gần nhất & agent
                last_msg = (
                    db.query(ChatMessage)
                    .filter(ChatMessage.session_id == s.id)
                    .order_by(ChatMessage.created_at.desc())
                    .first()
                )
                s_dict["last_agent"] = last_msg.agent_name if last_msg else None
                s_dict["last_message"] = (last_msg.content[:100] + "...") if last_msg and last_msg.content and len(last_msg.content) > 100 else (last_msg.content if last_msg else None)

                # Số lượng tin nhắn
                msg_count = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).count()
                s_dict["message_count"] = msg_count

                results.append(s_dict)

            # Thống kê tổng quan cho Admin
            total_sessions = db.query(ChatSession).count()
            total_messages = db.query(ChatMessage).count()
            total_user_questions = db.query(ChatMessage).filter(ChatMessage.role == "user").count()

            return {
                "sessions": results,
                "total": total,
                "stats": {
                    "total_sessions": total_sessions,
                    "total_messages": total_messages,
                    "total_questions": total_user_questions
                }
            }

    def delete_session(self, session_id: str) -> bool:
        """Xóa một phiên hội thoại và toàn bộ tin nhắn liên quan."""
        with get_db() as db:
            session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session:
                db.delete(session)
                db.commit()
                return True
            return False

_session_manager_instance = None

def get_session_manager() -> SessionManager:
    global _session_manager_instance
    if _session_manager_instance is None:
        _session_manager_instance = SessionManager()
    return _session_manager_instance
