import os
import json
import logging
from typing import List, Dict, Any
from db.database import get_db
from db.models import Movie, Article
from .embedder import get_embedder
from .vector_store import get_vector_store

logger = logging.getLogger("chatbot.rag.indexer")

DEFAULT_CINEMA_FAQS = [
    {
        "id": "faq_cancellation_policy",
        "title": "Chính sách hủy vé và hoàn tiền rạp chiếu",
        "type": "policy",
        "content": (
            "Chính sách hủy vé: Khách hàng có thể hủy đơn đặt vé ở trạng thái 'PENDING' (đang chờ thanh toán trong vòng 10 phút) "
            "bất kỳ lúc nào mà không phát sinh chi phí, ghế sẽ lập tức được giải phóng về trạng thái khả dụng (AVAILABLE). "
            "Đối với vé đã thanh toán thành công (CONFIRMED), khách hàng cần liên hệ trực tiếp quầy vé hoặc hotline chăm sóc khách hàng "
            "trước giờ chiếu tối thiểu 60 phút để được hỗ trợ theo quy định hoàn vé/đổi vé."
        )
    },
    {
        "id": "faq_age_ratings",
        "title": "Quy định phân loại độ tuổi xem phim điện ảnh",
        "type": "policy",
        "content": (
            "Phân loại độ tuổi khán giả tại rạp: "
            "P: Phim phổ biến, được phép phổ biến đến mọi đối tượng khán giả. "
            "K: Phim được phép phổ biến đến khán giả dưới 13 tuổi với điều kiện có cha, mẹ hoặc người giám hộ đi cùng. "
            "T13: Phim cấm khán giả dưới 13 tuổi. "
            "T16: Phim cấm khán giả dưới 16 tuổi. "
            "T18: Phim cấm khán giả dưới 18 tuổi. "
            "C: Phim cấm phổ biến. "
            "Khán giả cần xuất trình giấy tờ tùy thân (CCCD, thẻ học sinh/sinh viên) khi vào rạp xem phim có giới hạn độ tuổi."
        )
    },
    {
        "id": "faq_combos_and_foods",
        "title": "Quy định về đồ ăn và thức uống F&B tại rạp",
        "type": "policy",
        "content": (
            "Rạp cung cấp các combo bắp rang bơ thơm ngon (vị phô mai, caramel, truyền thống) và các loại nước ngọt có gas, nước khoáng. "
            "Khách hàng không được mang đồ ăn có mùi nồng, nước uống có cồn từ bên ngoài vào phòng chiếu phim."
        )
    }
]

def load_policies() -> List[Dict[str, Any]]:
    """Tải danh sách chính sách từ file data/policies.json, fallback sang DEFAULT_CINEMA_FAQS nếu không có file."""
    data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "policies.json")
    if os.path.exists(data_path):
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                policies = json.load(f)
                if isinstance(policies, list) and len(policies) > 0:
                    logger.info(f"Loaded {len(policies)} policies from {data_path}")
                    return policies
        except Exception as e:
            logger.warning(f"Error reading policies.json: {e}. Using DEFAULT_CINEMA_FAQS.")
    return DEFAULT_CINEMA_FAQS

def reindex_policies() -> Dict[str, Any]:
    """Xóa các vector type='policy' cũ và index lại toàn bộ chính sách rạp từ policies.json."""
    embedder = get_embedder()
    vector_store = get_vector_store()

    logger.info("Purging existing 'policy' points from Vector DB...")
    vector_store.delete_by_type("policy")

    policies = load_policies()
    logger.info(f"Found {len(policies)} policies to embed.")

    if not policies:
        return {"success": True, "reindexed_count": 0, "message": "Không có chính sách nào để embed."}

    texts = [d["content"] for d in policies]
    vectors = embedder.embed_documents(texts)
    vector_store.upsert_documents(policies, vectors)

    logger.info(f"Successfully re-indexed {len(policies)} policies into Qdrant!")
    return {
        "success": True,
        "reindexed_count": len(policies),
        "message": f"Đã embed và lưu thành công {len(policies)} chính sách rạp vào Vector DB."
    }

def build_movie_document(movie: Movie) -> Dict[str, Any]:
    genre_names = ", ".join([g.name for g in movie.genres]) if movie.genres else "Chưa phân loại"
    content = (
        f"Tên phim: {movie.title} (Tên tiếng Anh: {movie.title_en or 'Không có'}).\n"
        f"Thể loại: {genre_names}.\n"
        f"Đạo diễn: {movie.director}.\n"
        f"Diễn viên: {movie.actors}.\n"
        f"Thời lượng: {movie.duration} phút.\n"
        f"Độ tuổi: {movie.age_rating}.\n"
        f"Ngôn ngữ: {movie.language} (Phụ đề: {movie.subtitle or 'Không'}).\n"
        f"Khởi chiếu: {movie.release_date} - Kết thúc: {movie.end_date}.\n"
        f"Trạng thái: {'Đang chiếu' if movie.status == 'NOW_SHOWING' else 'Sắp chiếu'}.\n"
        f"Tóm tắt cốt truyện: {movie.description}"
    )
    return {
        "id": f"movie_{movie.id}",
        "movie_id": movie.id,
        "title": movie.title,
        "type": "movie_synopsis",
        "content": content
    }

def build_article_document(article: Article) -> Dict[str, Any]:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(article.content or "", "html.parser")
    clean_content = soup.get_text(separator=" ", strip=True)
    if len(clean_content) > 1200:
        clean_content = clean_content[:1197] + "..."

    summary = (article.short_description or "").strip()
    if summary and summary in clean_content:
        content_text = f"Bài viết tin tức: {article.title}\nNội dung: {clean_content}"
    else:
        content_text = (
            f"Bài viết tin tức: {article.title}\n"
            f"Tóm tắt: {summary}\n"
            f"Nội dung: {clean_content}"
        )

    return {
        "id": f"article_{article.id}",
        "article_id": article.id,
        "title": article.title,
        "type": "article",
        "content": content_text
    }

def reindex_articles() -> Dict[str, Any]:
    """Xóa sạch các bài viết cũ/rác trong Vector DB và chỉ embed lại các bài viết chuẩn từ MySQL."""
    embedder = get_embedder()
    vector_store = get_vector_store()

    # 1. Xóa toàn bộ points kiểu 'article' khỏi Qdrant
    logger.info("Purging all existing 'article' points from Vector DB...")
    vector_store.delete_by_type("article")

    # 2. Lấy danh sách bài viết chuẩn mới nhất từ MySQL
    article_docs: List[Dict[str, Any]] = []
    try:
        with get_db() as db:
            articles = db.query(Article).all()
            for a in articles:
                article_docs.append(build_article_document(a))
    except Exception as e:
        logger.error(f"Error fetching articles from MySQL: {e}")
        return {"success": False, "error": str(e)}

    logger.info(f"Found {len(article_docs)} authentic articles from MySQL to embed.")
    if not article_docs:
        return {"success": True, "reindexed_count": 0, "message": "Không có bài viết nào trong MySQL để embed."}

    # 3. Batch embedding từng đợt (chunks of 5)
    batch_size = 5
    total_embedded = 0
    for i in range(0, len(article_docs), batch_size):
        chunk = article_docs[i:i + batch_size]
        texts = [d["content"] for d in chunk]
        vectors = embedder.embed_documents(texts)
        vector_store.upsert_documents(chunk, vectors)
        total_embedded += len(chunk)
        logger.info(f"Progress: Embedded {total_embedded}/{len(article_docs)} articles to Qdrant.")

    logger.info(f"Successfully re-indexed {total_embedded} articles into Qdrant!")
    return {
        "success": True,
        "reindexed_count": total_embedded,
        "message": f"Đã làm sạch và embed thành công {total_embedded} bài báo điện ảnh mới vào RAG."
    }

def index_all_data(force_reindex: bool = False, clean_articles_first: bool = False) -> Dict[str, Any]:
    """Quét dữ liệu nội dung phim, bài viết và chính sách từ MySQL và index vào Qdrant
    theo CƠ CHẾ ADD THÊM (chỉ embed những tài liệu chưa có trong Vector DB).
    """
    embedder = get_embedder()
    vector_store = get_vector_store()

    if clean_articles_first:
        logger.info("clean_articles_first=True: Purging old 'article' points from Qdrant before indexing...")
        vector_store.delete_by_type("article")

    all_docs: List[Dict[str, Any]] = []

    # 1. Thêm FAQs và chính sách rạp
    all_docs.extend(load_policies())

    # 2. Trích xuất Phim từ MySQL
    try:
        with get_db() as db:
            movies = db.query(Movie).all()
            for m in movies:
                all_docs.append(build_movie_document(m))

            # 3. Trích xuất Bài viết tin tức từ MySQL
            articles = db.query(Article).all()
            for a in articles:
                all_docs.append(build_article_document(a))
    except Exception as e:
        logger.error(f"Error fetching movies/articles from MySQL: {e}")

    logger.info(f"Total candidate documents scanned from system: {len(all_docs)}")

    # 4. Cơ chế ADD THÊM: kiểm tra các ID đã tồn tại trong Qdrant
    if not force_reindex:
        existing_ids = vector_store.get_existing_ids()
        docs_to_index = [d for d in all_docs if str(d["id"]) not in existing_ids]
        logger.info(f"Incremental Check: {len(existing_ids)} documents already in Qdrant. Found {len(docs_to_index)} NEW documents to embed.")
    else:
        docs_to_index = all_docs
        logger.info(f"Force reindex: embedding all {len(docs_to_index)} documents.")

    if not docs_to_index:
        logger.info("All documents are already up-to-date in Qdrant! No new embedding needed.")
        return {
            "total_scanned": len(all_docs),
            "already_indexed": len(all_docs),
            "newly_indexed": 0,
            "message": "Dữ liệu đã đầy đủ trong Qdrant, không có tài liệu mới cần embed."
        }

    # 5. Batch embedding theo từng đợt (chunks of 5) để tối ưu bộ nhớ và CPU
    batch_size = 5
    total_embedded = 0

    for i in range(0, len(docs_to_index), batch_size):
        chunk = docs_to_index[i:i + batch_size]
        texts = [d["content"] for d in chunk]
        vectors = embedder.embed_documents(texts)
        vector_store.upsert_documents(chunk, vectors)
        total_embedded += len(chunk)
        logger.info(f"Progress: Embedded and saved {total_embedded}/{len(docs_to_index)} documents to Qdrant.")

    logger.info("Incremental RAG Indexing completed successfully!")
    return {
        "total_scanned": len(all_docs),
        "already_indexed": len(all_docs) - total_embedded,
        "newly_indexed": total_embedded,
        "message": f"Đã embed và lưu thành công {total_embedded} tài liệu mới vào Qdrant."
    }

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = index_all_data()
    print("Result:", result)
