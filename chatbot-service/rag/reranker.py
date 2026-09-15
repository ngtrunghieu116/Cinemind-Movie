import os
import logging
import urllib3
from typing import List, Dict, Any, Tuple
from config import settings

urllib3.disable_warnings()
os.environ["CURL_CA_BUNDLE"] = ""
os.environ["REQUESTS_CA_BUNDLE"] = ""

logger = logging.getLogger("chatbot.rag.reranker")

class Reranker:
    """Reranker using models--namdp-ptit--ViRanker (namdp-ptit/ViRanker) Cross-Encoder."""

    def __init__(self, model_name_or_path: str = None):
        self.model_name_or_path = model_name_or_path or settings.RERANKER_MODEL
        self._model = None
        self._tokenizer = None
        self._is_loaded = False
        self._load_attempted = False
        self._cache: Dict[Tuple[str, str], float] = {}

    def _lazy_load(self):
        if self._is_loaded or self._load_attempted:
            return
        self._load_attempted = True

        try:
            import torch
            from transformers import AutoTokenizer, AutoModelForSequenceClassification

            # Optimize PyTorch CPU thread count to avoid thread contention / core thrashing
            cpu_threads = min(4, os.cpu_count() or 4)
            torch.set_num_threads(cpu_threads)

            path = self.model_name_or_path
            # Check if directory exists locally
            if not os.path.exists(path):
                # Try fallback to HuggingFace Hub name if local folder doesn't exist
                if path.startswith("models--"):
                    # convert models--namdp-ptit--ViRanker -> namdp-ptit/ViRanker
                    repo_id = path.replace("models--", "").replace("--", "/")
                else:
                    repo_id = "namdp-ptit/ViRanker"
            else:
                repo_id = path

            logger.info(f"Loading ViRanker reranker model from: {repo_id} (CPU threads={cpu_threads})")
            # First attempt: load from local cache only without blocking
            try:
                self._tokenizer = AutoTokenizer.from_pretrained(repo_id, local_files_only=True)
                self._model = AutoModelForSequenceClassification.from_pretrained(repo_id, local_files_only=True)
                self._model.to(settings.DEVICE)
                self._model.eval()
                self._is_loaded = True
                logger.info("ViRanker model loaded successfully from local cache.")
                return
            except Exception as local_err:
                logger.info(f"ViRanker weights not fully cached locally yet ({local_err}). Using fast lexical reranker fallback.")
                self._is_loaded = False
                return
        except Exception as e:
            logger.warning(f"Could not load ViRanker model ({e}). Using lexical fallback reranker.")
            self._is_loaded = False

    def rerank(self, query: str, documents: List[Dict[str, Any]], top_k: int = 4) -> List[Dict[str, Any]]:
        """Rerank a list of documents given a query string.
        Each document is a dict containing at least 'content' or 'text'.
        """
        if not documents:
            return []

        if len(documents) <= 1:
            return documents

        self._lazy_load()

        if self._is_loaded and self._model is not None:
            try:
                import torch

                scored_docs = []
                uncached_pairs = []
                uncached_indices = []

                clean_query = query.strip()
                for idx, doc in enumerate(documents):
                    text = (doc.get("content") or doc.get("text") or "").strip()
                    # Use cache key (query, first 120 chars of doc text)
                    cache_key = (clean_query, text[:120])
                    if cache_key in self._cache:
                        scored_docs.append((idx, self._cache[cache_key]))
                    else:
                        uncached_pairs.append([clean_query, text])
                        uncached_indices.append((idx, cache_key))

                if uncached_pairs:
                    # Tokenize with max_length=128 for snappy CPU inference
                    inputs = self._tokenizer(
                        uncached_pairs,
                        padding=True,
                        truncation=True,
                        max_length=128,
                        return_tensors="pt"
                    ).to(settings.DEVICE)

                    with torch.no_grad():
                        scores = self._model(**inputs).logits.squeeze(-1)
                        if scores.ndim == 0:
                            scores = scores.unsqueeze(0)
                        scores_list = scores.cpu().tolist()
                        if isinstance(scores_list, float):
                            scores_list = [scores_list]

                    for (idx, cache_key), score in zip(uncached_indices, scores_list):
                        score_val = float(score)
                        self._cache[cache_key] = score_val
                        # Keep cache from growing unbounded
                        if len(self._cache) > 500:
                            self._cache.pop(next(iter(self._cache)))
                        scored_docs.append((idx, score_val))

                # Attach scores back to documents
                scored_docs.sort(key=lambda x: x[1], reverse=True)
                result_docs = []
                for doc_idx, score in scored_docs[:top_k]:
                    result_docs.append({**documents[doc_idx], "rerank_score": score})

                return result_docs
            except Exception as e:
                logger.error(f"Error during ViRanker inference: {e}. Falling back to lexical scoring.")

        # Lexical overlap fallback
        return self._fallback_lexical_rerank(query, documents, top_k)

    def _fallback_lexical_rerank(self, query: str, documents: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        query_terms = set(query.lower().split())
        scored = []
        for doc in documents:
            content = (doc.get("content") or doc.get("text") or "").lower()
            score = sum(1.0 for term in query_terms if term in content)
            scored.append({**doc, "rerank_score": score})

        scored.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored[:top_k]

_reranker_instance = None

def get_reranker() -> Reranker:
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = Reranker()
    return _reranker_instance
