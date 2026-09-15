import os
import logging
import requests
import urllib3
from typing import List, Union
from config import settings

# Vô hiệu hóa cảnh báo SSL và cho phép tải model qua proxy cert
urllib3.disable_warnings()
os.environ["CURL_CA_BUNDLE"] = ""
os.environ["REQUESTS_CA_BUNDLE"] = ""

logger = logging.getLogger("chatbot.rag.embedder")

class Embedder:
    """Embedding model supporting Ollama API (e.g. jeffh/intfloat-multilingual-e5-large-instruct:Q8_0)
    and SentenceTransformers (e.g. BAAI/bge-m3).
    """

    def __init__(self, model_name: str = None, dimension: int = 1024):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.dimension = dimension
        self._hf_model = None
        self._is_ollama = ":" in self.model_name or "ollama" in self.model_name.lower() or "/" in self.model_name

        logger.info(f"Initialized Embedder with model: {self.model_name}, is_ollama: {self._is_ollama}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents."""
        if not texts:
            return []

        # 1. Thử gọi Ollama API nếu model được cấu hình
        if self._is_ollama:
            try:
                embeddings = self._embed_ollama(texts)
                if embeddings and len(embeddings) == len(texts):
                    return embeddings
            except Exception as e:
                logger.warning(f"Ollama embedding chưa sẵn sàng cho model {self.model_name} ({e}). Sử dụng vector fallback tạm thời...")
                return self._dummy_embeddings(texts)

        # 2. Thử gọi SentenceTransformers cục bộ nếu không phải Ollama model
        try:
            return self._embed_sentence_transformers(texts)
        except Exception as e:
            logger.warning(f"SentenceTransformers embedding failed: {e}. Falling back to pseudo-embeddings...")

        # 3. Fallback dummy embeddings cho môi trường dev
        return self._dummy_embeddings(texts)

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""
        results = self.embed_documents([text])
        return results[0] if results else [0.0] * self.dimension

    def _embed_ollama(self, texts: List[str]) -> List[List[float]]:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embed"
        payload = {
            "model": self.model_name,
            "input": texts
        }
        res = requests.post(url, json=payload, timeout=180)
        if res.status_code == 200:
            data = res.json()
            if "embeddings" in data:
                return data["embeddings"]

        # Fallback to legacy /api/embeddings for single text
        legacy_url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
        embeddings = []
        for t in texts:
            r = requests.post(legacy_url, json={"model": self.model_name, "prompt": t}, timeout=20)
            if r.status_code == 200:
                embeddings.append(r.json().get("embedding", []))
            else:
                raise RuntimeError(f"Ollama error: {r.text}")
        return embeddings

    def _embed_sentence_transformers(self, texts: List[str]) -> List[List[float]]:
        if self._hf_model is None:
            from sentence_transformers import SentenceTransformer
            # If Ollama tag, fallback to bge-m3 for sentence-transformers
            target_model = "BAAI/bge-m3" if ":" in self.model_name else self.model_name
            logger.info(f"Loading SentenceTransformer model: {target_model}")
            self._hf_model = SentenceTransformer(target_model, device=settings.DEVICE)

        vectors = self._hf_model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return vectors.tolist()

    def _dummy_embeddings(self, texts: List[str]) -> List[List[float]]:
        import hashlib
        embeddings = []
        for text in texts:
            h = hashlib.sha256(text.encode("utf-8")).digest()
            vec = [(b / 255.0) * 2 - 1 for b in h]
            while len(vec) < self.dimension:
                vec.extend(vec[:min(len(vec), self.dimension - len(vec))])
            embeddings.append(vec[:self.dimension])
        return embeddings

_embedder_instance = None

def get_embedder() -> Embedder:
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = Embedder()
    return _embedder_instance
