import logging
from typing import Optional, Dict, Any
from config import settings

logger = logging.getLogger("chatbot.monitoring.langfuse")

class DummySpan:
    def span(self, *args, **kwargs):
        return self
    def update(self, *args, **kwargs):
        pass
    def end(self, *args, **kwargs):
        pass

class TraceWrapper:
    """Wrapper that adapts Langfuse v4 start_observation into familiar span() interface."""
    def __init__(self, raw_obs):
        self._raw = raw_obs

    def span(self, name: str, input: Any = None, as_type: str = "span", **kwargs):
        if self._raw and hasattr(self._raw, "start_observation"):
            try:
                child = self._raw.start_observation(name=name, as_type=as_type, input=input, **kwargs)
                return TraceWrapper(child)
            except Exception as e:
                logger.debug(f"Error starting child observation: {e}")
        return DummySpan()

    def generation(self, name: str, model: str = None, input: Any = None, output: Any = None, usage_details: Dict[str, int] = None, **kwargs):
        if self._raw and hasattr(self._raw, "start_observation"):
            try:
                child = self._raw.start_observation(
                    name=name,
                    as_type="generation",
                    model=model or settings.CLOUD_MODEL_NAME,
                    input=input,
                    output=output,
                    usage_details=usage_details,
                    **kwargs
                )
                return TraceWrapper(child)
            except Exception as e:
                logger.debug(f"Error starting generation observation: {e}")
        return DummySpan()

    def update(self, **kwargs):
        if self._raw and hasattr(self._raw, "update"):
            try:
                self._raw.update(**kwargs)
            except Exception as e:
                logger.debug(f"Error updating observation: {e}")

    def end(self, output: Any = None, **kwargs):
        if self._raw:
            try:
                update_payload = dict(kwargs)
                if output is not None:
                    update_payload["output"] = output
                if update_payload and hasattr(self._raw, "update"):
                    self._raw.update(**update_payload)
                if hasattr(self._raw, "end"):
                    self._raw.end()
            except Exception as e:
                logger.debug(f"Error ending observation: {e}")

class LangfuseMonitor:
    """Wrapper for Langfuse v4 tracing and observability."""

    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
            logger.info("Langfuse keys not provided. Tracing will run in no-op mode.")
            return

        try:
            import urllib.request
            urllib.request.urlopen(f"{settings.LANGFUSE_BASE_URL}/api/public/health", timeout=0.5)
            from langfuse import Langfuse
            self.client = Langfuse(
                public_key=settings.LANGFUSE_PUBLIC_KEY,
                secret_key=settings.LANGFUSE_SECRET_KEY,
                host=settings.LANGFUSE_BASE_URL
            )
            logger.info(f"Langfuse initialized successfully with host: {settings.LANGFUSE_BASE_URL}")
        except Exception as e:
            logger.info(f"Langfuse server not reachable at {settings.LANGFUSE_BASE_URL} ({e}). Operating in fallback mode.")
            self.client = None

    def trace(
        self,
        name: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        input_data: Optional[Any] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TraceWrapper:
        """Create a new root trace observation in Langfuse v4."""
        if not self.client:
            return DummySpan()

        try:
            meta = dict(metadata or {})
            if session_id:
                meta["session_id"] = session_id
            if user_id:
                meta["user_id"] = str(user_id)

            obs = self.client.start_observation(
                name=name,
                as_type="chain",
                input=input_data,
                metadata=meta
            )
            return TraceWrapper(obs)
        except Exception as e:
            logger.error(f"Error creating Langfuse observation: {e}")
            return DummySpan()

    def flush(self):
        if self.client:
            try:
                self.client.flush()
            except Exception as e:
                logger.error(f"Error flushing Langfuse client: {e}")

_monitor_instance = None

def get_langfuse_monitor() -> LangfuseMonitor:
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = LangfuseMonitor()
    return _monitor_instance
