import logging
from typing import List, Dict, Any, Optional
from .embedder import get_embedder
from .vector_store import get_vector_store
from .reranker import get_reranker

logger = logging.getLogger("chatbot.rag.retriever")

class MovieRetriever:
    """End-to-end RAG Retriever pipeline:
    User Query -> Embed with bge-m3 / multilingual-e5 -> Search Qdrant -> Rerank with ViRanker -> Top-K
    """

    def __init__(self):
        self.embedder = get_embedder()
        self.vector_store = get_vector_store()
        self.reranker = get_reranker()

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        candidate_pool_size: int = 6,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve and rerank relevant movie documents."""
        if not query or not query.strip():
            return []

        logger.info(f"Retrieving for query: '{query}', candidate_pool: {candidate_pool_size}, top_k: {top_k}")

        # 1. Embed query
        query_vector = self.embedder.embed_query(query)

        # 2. Vector search in Qdrant
        candidates = self.vector_store.search(
            query_vector=query_vector,
            limit=candidate_pool_size,
            filter_dict=filter_dict
        )

        if not candidates:
            logger.info("No candidates found in vector store.")
            return []

        # 3. Rerank with ViRanker
        reranked = self.reranker.rerank(
            query=query,
            documents=candidates,
            top_k=top_k
        )

        logger.info(f"Retrieved and reranked {len(reranked)} top documents.")
        return reranked

_retriever_instance = None

def get_retriever() -> MovieRetriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = MovieRetriever()
    return _retriever_instance
