import logging
import os
import sys
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure root of chatbot-service is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from db.init_db import init_chat_tables
from agent.cinema_orchestration_agent import get_chatbot_coordinator
from agent.memory.session_manager import get_session_manager
from rag.indexer import index_all_data, reindex_articles, reindex_policies

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("chatbot.main")

app = FastAPI(
    title="Cinema AI Chatbot Service",
    description="Microservice Trợ lý ảo AI đặt vé xem phim với DeepSeek, Langfuse, RAG (bge-m3/e5 + ViRanker), MySQL và MCP Tools.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép gọi từ dashboard (3000, 3001, 5173, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Cinema Chatbot Service...")
    # Khởi tạo các bảng chat trong MySQL nếu chưa tồn tại
    init_chat_tables()
    logger.info("Service startup finished.")

# Request & Response Models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    agent_used: str
    route_action: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    authorization: Optional[str] = Header(None)
):
    """Endpoint trò chuyện chính với AI Chatbot.
    Tự động tiếp nhận Authorization token từ frontend nếu user đã login.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Nội dung tin nhắn không được để trống.")

    coordinator = get_chatbot_coordinator()

    result = coordinator.process_message(
        message=request.message,
        session_id=request.session_id,
        auth_token=authorization,
        user_id=request.user_id
    )

    return ChatResponse(
        session_id=result["session_id"],
        reply=result["reply"],
        agent_used=result["agent_used"],
        route_action=result.get("route_action"),
        tool_calls=result.get("tool_calls")
    )

@app.get("/api/chat/history/{session_id}")
def get_chat_history(session_id: str):
    """Lấy lịch sử tin nhắn của một session chat từ MySQL."""
    sm = get_session_manager()
    history = sm.get_history(session_id, limit=30)
    return {"session_id": session_id, "messages": history}

@app.get("/api/chat/sessions")
def get_user_sessions(
    user_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 30,
    offset: int = 0
):
    """Lấy danh sách tất cả các session chat của user_id hoặc các session gần đây kèm theo thống kê cho Admin."""
    sm = get_session_manager()
    result = sm.list_user_sessions(user_id=user_id, search=search, limit=limit, offset=offset)
    return {
        "user_id": user_id,
        "sessions": result["sessions"],
        "total": result["total"],
        "stats": result["stats"]
    }

@app.delete("/api/chat/sessions/{session_id}")
def delete_chat_session(session_id: str):
    """Xóa một phiên hội thoại khỏi database."""
    sm = get_session_manager()
    success = sm.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên hội thoại để xóa.")
    return {"success": True, "message": "Đã xóa phiên hội thoại thành công."}

@app.post("/api/rag/index")
def trigger_rag_indexing():
    """Kích hoạt quét dữ liệu từ MySQL (movies, reviews, articles) và index vào Qdrant."""
    try:
        count = index_all_data()
        return {"success": True, "indexed_documents": count, "message": "Index RAG hoàn tất."}
    except Exception as e:
        logger.error(f"RAG indexing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/reindex-articles")
def trigger_rag_reindex_articles():
    """Làm sạch toàn bộ tin tức cũ/rác trong RAG và index lại các bài viết điện ảnh chuẩn từ MySQL."""
    try:
        result = reindex_articles()
        return result
    except Exception as e:
        logger.error(f"RAG reindex articles error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/reindex-policies")
def trigger_rag_reindex_policies():
    """Làm sạch các vector chính sách cũ trong RAG và index lại toàn bộ chính sách rạp từ policies.json."""
    try:
        result = reindex_policies()
        return result
    except Exception as e:
        logger.error(f"RAG reindex policies error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Kiểm tra tình trạng hoạt động của service."""
    return {
        "status": "healthy",
        "llm_model": settings.CLOUD_MODEL_NAME,
        "embedding_model": settings.EMBEDDING_MODEL,
        "reranker_model": settings.RERANKER_MODEL,
        "mysql_host": settings.DB_HOST,
        "qdrant_host": settings.QDRANT_HOST,
        "langfuse_enabled": bool(settings.LANGFUSE_PUBLIC_KEY and settings.LANGFUSE_SECRET_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True
    )
