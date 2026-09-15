import time
import logging
from typing import Optional, Dict, Any, List
from .utils.context_utils import build_enriched_context_prompt, extract_user_context
from .guard.safe_guard import get_safe_guard
from .orchestrator.router import get_orchestrator
from .specialists.discovery_agent import get_discovery_agent
from .specialists.showtime_booking_agent import get_showtime_booking_agent
from .specialists.ticket_support_agent import get_ticket_support_agent
from .specialists.navigation_agent import get_navigation_agent
from .memory.session_manager import get_session_manager
from monitoring.langfuse_client import get_langfuse_monitor

logger = logging.getLogger("chatbot.agent.orchestrator_agent")

class CinemaChatbotCoordinator:
    """Điều phối toàn bộ quy trình Chatbot:
    Context Enrichment -> Safe Guard -> Orchestrator -> Specialist Agent -> MySQL Persistence -> Langfuse Tracing
    """

    def __init__(self):
        self.safe_guard = get_safe_guard()
        self.orchestrator = get_orchestrator()
        self.session_manager = get_session_manager()
        self.langfuse = get_langfuse_monitor()

    def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        auth_token: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        user_context = extract_user_context(token=auth_token, user_id=user_id)
        effective_user_id = user_context.get("user_id") if user_context else user_id

        # 1. Quản lý Session trong MySQL
        session_obj = self.session_manager.get_or_create_session(
            session_id=session_id,
            user_id=effective_user_id
        )
        active_session_id = session_obj["id"]

        # 2. Lưu tin nhắn người dùng vào MySQL
        self.session_manager.add_message(
            session_id=active_session_id,
            role="user",
            content=message
        )

        # 3. Khởi tạo Langfuse Trace
        trace = self.langfuse.trace(
            name="cinema_chat_pipeline",
            session_id=active_session_id,
            user_id=str(effective_user_id) if effective_user_id else "guest",
            input_data={"message": message, "user_context": user_context}
        )

        # 4. Context Enrichment & Chat History
        context_prompt = build_enriched_context_prompt(token=auth_token, user_id=effective_user_id)
        history = self.session_manager.get_history(active_session_id, limit=10)

        # 5. Layer 1: Safe Guard Check
        t_sg_start = time.perf_counter()
        sg_span = trace.span(name="safe_guard_check", as_type="guardrail", input={"message": message})
        guard_result = self.safe_guard.check(message, chat_history=history, trace_span=sg_span)
        # Guarantee non-zero millisecond interval so OpenTelemetry start_time and end_time don't collide
        time.sleep(0.005)
        sg_duration_ms = round((time.perf_counter() - t_sg_start) * 1000, 2)
        guard_result["total_sg_duration_ms"] = sg_duration_ms
        sg_span.end(
            output=guard_result,
            metadata={
                "duration_ms": sg_duration_ms,
                "latency_ms": sg_duration_ms,
                "method": guard_result.get("method"),
                "verdict": guard_result.get("verdict")
            }
        )

        if not guard_result.get("allowed", True):
            rejection_text = guard_result.get("reply", "Dạ, em chỉ có thể giải đáp các câu hỏi liên quan đến rạp phim ạ.")

            # Lưu phản hồi vào DB
            self.session_manager.add_message(
                session_id=active_session_id,
                role="assistant",
                content=rejection_text,
                agent_name="safe_guard"
            )

            trace.update(output={"response": rejection_text, "blocked_by_guard": True})
            self.langfuse.flush()

            return {
                "session_id": active_session_id,
                "reply": rejection_text,
                "agent_used": "safe_guard",
                "route_action": None,
                "tool_calls": []
            }

        # 6. Layer 2: Intent Orchestrator
        t_orch_start = time.perf_counter()
        orch_span = trace.span(name="intent_orchestrator", as_type="chain", input={"message": message})
        intent = self.orchestrator.route_intent(message, chat_history=history)
        time.sleep(0.002)
        orch_duration_ms = round((time.perf_counter() - t_orch_start) * 1000, 2)
        orch_span.end(
            output={"intent": intent, "duration_ms": orch_duration_ms},
            metadata={"duration_ms": orch_duration_ms, "latency_ms": orch_duration_ms}
        )

        logger.info(f"Routed intent for session {active_session_id}: {intent}")

        # 7. Layer 3: Chọn Specialist Agent tương ứng
        if intent == "BOOKING":
            agent = get_showtime_booking_agent()
        elif intent == "SUPPORT":
            agent = get_ticket_support_agent()
        elif intent == "NAVIGATION":
            agent = get_navigation_agent()
        elif intent == "GENERAL":
            # GENERAL có thể dùng DiscoveryAgent với prompt nhẹ nhàng
            agent = get_discovery_agent()
        else: # DISCOVERY
            agent = get_discovery_agent()

        agent_span = trace.span(
            name=f"specialist_{agent.name}",
            as_type="agent",
            input={"message": message, "intent": intent}
        )

        agent_result = agent.run(
            user_message=message,
            chat_history=history,
            context_prompt=context_prompt,
            user_context=user_context
        )

        agent_span.end(output=agent_result)

        reply_content = agent_result.get("content", "")
        tool_calls = agent_result.get("tool_calls_executed", [])

        # Kiểm tra xem có route điều hướng từ tool không
        route_action = None
        for tc in tool_calls:
            res = tc.get("result")
            if isinstance(res, dict):
                if res.get("action_type") == "NAVIGATE" or "route" in res:
                    route_action = res
                elif "checkout_route" in res and res.get("checkout_route"):
                    route_action = {
                        "action_type": "NAVIGATE",
                        "route": res["checkout_route"],
                        "title": "Thanh toán qua VNPAY",
                        "description": f"Đơn #{res.get('booking_code')} - Tiến hành thanh toán qua cổng VNPAY",
                        "booking_code": res.get("booking_code"),
                        "reservation_id": res.get("reservation_id")
                    }

        # 8. Lưu phản hồi của Assistant vào MySQL
        self.session_manager.add_message(
            session_id=active_session_id,
            role="assistant",
            content=reply_content,
            tool_calls=tool_calls if tool_calls else None,
            agent_name=agent.name
        )

        # 9. Kết thúc Langfuse Trace
        trace.end(output={"reply": reply_content, "agent_used": agent.name, "route_action": route_action})
        self.langfuse.flush()

        return {
            "session_id": active_session_id,
            "reply": reply_content,
            "agent_used": agent.name,
            "route_action": route_action,
            "tool_calls": tool_calls
        }

_coordinator_instance = None

def get_chatbot_coordinator() -> CinemaChatbotCoordinator:
    global _coordinator_instance
    if _coordinator_instance is None:
        _coordinator_instance = CinemaChatbotCoordinator()
    return _coordinator_instance
