import logging
import uuid
from typing import List, Dict, Any, Optional, Set
from config import settings

logger = logging.getLogger("chatbot.rag.vector_store")

def to_qdrant_uuid(raw_id: str) -> str:
    """Chuyển đổi bất kỳ chuỗi ID nào thành định dạng UUID hợp lệ cho Qdrant."""
    try:
        return str(uuid.UUID(str(raw_id)))
    except (ValueError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(raw_id)))

class QdrantVectorStore:
    """Wrapper around Qdrant client with automatic fallback and incremental upsert."""

    def __init__(self, collection_name: str = None, dimension: int = 1024):
        self.collection_name = collection_name or settings.QDRANT_COLLECTION
        self.dimension = dimension
        self.client = None
        self._memory_store = [] # Fallback in-memory list of dicts: {"id", "vector", "payload"}
        self._init_client()

    def _init_client(self):
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.http import models

            if settings.QDRANT_API_KEY:
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    api_key=settings.QDRANT_API_KEY,
                    timeout=10
                )
            else:
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    timeout=10
                )

            # Test connection and check collection
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.dimension,
                        distance=models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name} (dim: {self.dimension})")
            else:
                logger.info(f"Connected to existing Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.warning(f"Failed to connect to Qdrant ({e}). Falling back to in-memory vector store.")
            self.client = None

    def get_existing_ids(self) -> Set[str]:
        """Lấy danh sách các custom ID (e.g. 'movie_1', 'article_2') đã tồn tại trong Vector DB."""
        if self.client:
            try:
                existing = set()
                offset = None
                while True:
                    records, offset = self.client.scroll(
                        collection_name=self.collection_name,
                        limit=1000,
                        offset=offset,
                        with_payload=True,
                        with_vectors=False
                    )
                    for r in records:
                        if r.payload and "id" in r.payload:
                            existing.add(str(r.payload["id"]))
                        else:
                            existing.add(str(r.id))
                    if offset is None:
                        break
                return existing
            except Exception as e:
                logger.error(f"Error fetching existing IDs from Qdrant: {e}")

        # Fallback in-memory
        return {str(item["payload"].get("id", item["id"])) for item in self._memory_store}

    def upsert_documents(self, documents: List[Dict[str, Any]], vectors: List[List[float]]):
        """Thêm mới hoặc cập nhật documents vào Qdrant."""
        if not documents or not vectors or len(documents) != len(vectors):
            return

        if self.client:
            try:
                from qdrant_client.http import models
                points = []
                for doc, vec in zip(documents, vectors):
                    raw_id = doc.get("id") or str(uuid.uuid4())
                    point_id = to_qdrant_uuid(raw_id)
                    points.append(
                        models.PointStruct(
                            id=point_id,
                            vector=vec,
                            payload=doc
                        )
                    )
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )
                logger.info(f"Successfully upserted {len(points)} points to Qdrant collection '{self.collection_name}'.")
                return
            except Exception as e:
                logger.error(f"Error upserting to Qdrant: {e}. Storing in memory fallback.")

        # In-memory fallback
        for doc, vec in zip(documents, vectors):
            raw_id = doc.get("id") or str(uuid.uuid4())
            point_id = to_qdrant_uuid(raw_id)
            self._memory_store.append({
                "id": point_id,
                "vector": vec,
                "payload": doc
            })
        logger.info(f"Stored {len(documents)} points in in-memory vector store.")

    def delete_by_type(self, doc_type: str) -> bool:
        """Xóa toàn bộ points trong Vector DB có payload 'type' khớp với doc_type (ví dụ 'article')."""
        if self.client:
            try:
                from qdrant_client.http import models
                res = self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=models.FilterSelector(
                        filter=models.Filter(
                            must=[
                                models.FieldCondition(
                                    key="type",
                                    match=models.MatchValue(value=doc_type)
                                )
                            ]
                        )
                    )
                )
                logger.info(f"Deleted all points of type '{doc_type}' from Qdrant: {res}")
                return True
            except Exception as e:
                logger.error(f"Error deleting points of type '{doc_type}' from Qdrant: {e}")
                return False

        # Fallback in-memory
        initial_len = len(self._memory_store)
        self._memory_store = [
            item for item in self._memory_store 
            if item.get("payload", {}).get("type") != doc_type
        ]
        logger.info(f"Removed {initial_len - len(self._memory_store)} points of type '{doc_type}' from in-memory store.")
        return True

    def delete_by_ids(self, raw_ids: List[str]) -> bool:
        """Xóa points theo danh sách ID thô (ví dụ ['article_1', 'article_2'])."""
        if not raw_ids:
            return True

        point_ids = [to_qdrant_uuid(rid) for rid in raw_ids]
        if self.client:
            try:
                from qdrant_client.http import models
                res = self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=models.PointIdsList(points=point_ids)
                )
                logger.info(f"Deleted {len(point_ids)} points from Qdrant: {res}")
                return True
            except Exception as e:
                logger.error(f"Error deleting points from Qdrant: {e}")
                return False

        # In-memory fallback
        id_set = set(point_ids)
        self._memory_store = [item for item in self._memory_store if item.get("id") not in id_set]
        return True

    def search(self, query_vector: Optional[List[float]] = None, limit: int = 10, filter_dict: Optional[Dict[str, Any]] = None, query_text: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tìm kiếm top-N documents tương đồng nhất qua query_vector hoặc query_text."""
        if query_vector is None and query_text:
            from .embedder import get_embedder
            query_vector = get_embedder().embed_query(query_text)
        elif query_vector is None:
            query_vector = [0.0] * self.dimension
        if self.client:
            try:
                from qdrant_client.http import models
                qdrant_filter = None
                if filter_dict:
                    conditions = []
                    for k, v in filter_dict.items():
                        conditions.append(
                            models.FieldCondition(key=k, match=models.MatchValue(value=v))
                        )
                    qdrant_filter = models.Filter(must=conditions)

                if hasattr(self.client, "query_points"):
                    response = self.client.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        query_filter=qdrant_filter,
                        limit=limit
                    )
                    points = response.points
                else:
                    points = self.client.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        query_filter=qdrant_filter,
                        limit=limit
                    )

                results = []
                for point in points:
                    doc = dict(point.payload or {})
                    doc["qdrant_point_id"] = str(point.id)
                    doc["score"] = float(point.score)
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"Error searching Qdrant: {e}. Falling back to in-memory search.")

        # In-memory cosine similarity search
        return self._search_memory(query_vector, limit, filter_dict)

    def _search_memory(self, query_vector: List[float], limit: int, filter_dict: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        import math

        def cosine_similarity(v1, v2):
            dot = sum(a * b for a, b in zip(v1, v2))
            norm1 = math.sqrt(sum(a * a for a in v1))
            norm2 = math.sqrt(sum(b * b for b in v2))
            if norm1 == 0 or norm2 == 0:
                return 0.0
            return dot / (norm1 * norm2)

        scored = []
        for item in self._memory_store:
            doc = item["payload"]
            if filter_dict:
                match = True
                for k, v in filter_dict.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            score = cosine_similarity(query_vector, item["vector"])
            doc_copy = dict(doc)
            doc_copy["score"] = score
            scored.append(doc_copy)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

_vector_store_instance = None

def get_vector_store() -> QdrantVectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = QdrantVectorStore()
    return _vector_store_instance
