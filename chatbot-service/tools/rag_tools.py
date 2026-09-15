import logging
from typing import Optional, List, Dict, Any
from rag.retriever import get_retriever

logger = logging.getLogger("chatbot.tools.rag")

def query_movie_knowledge_rag(
    query: str,
    category: Optional[str] = None,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """Tìm kiếm thông tin tri thức về phim và rạp chiếu qua cơ chế RAG (bge-m3 + ViRanker + Qdrant).
    - query: Câu hỏi về nội dung, cốt truyện, diễn viên, đạo diễn, quy định độ tuổi, chính sách hoàn hủy vé, quy định rạp...
    - category: Lọc theo loại ('movie_synopsis', 'policy', 'article', 'review')
    - top_k: (Tùy chọn) Số lượng tài liệu phù hợp nhất cần trả về (mặc định là 5).
    """
    retriever = get_retriever()
    filter_dict = {"type": category} if category else None

    docs = retriever.retrieve(
        query=query,
        top_k=top_k,
        candidate_pool_size=max(15, top_k * 3),
        filter_dict=filter_dict
    )

    results = []
    for d in docs:
        results.append({
            "title": d.get("title", "Thông tin"),
            "type": d.get("type", "knowledge"),
            "content": d.get("content", ""),
            "relevance_score": round(d.get("rerank_score", 0.0), 3)
        })
    return results

def search_reviews_rag(movie_name: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Tìm kiếm đánh giá (review) và nhận xét của khán giả về một bộ phim cụ thể qua RAG."""
    query = f"Đánh giá nhận xét cảm nhận khán giả về phim {movie_name}"
    return query_movie_knowledge_rag(query=query, category="review", top_k=top_k)
