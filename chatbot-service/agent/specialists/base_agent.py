import json
import logging
import inspect
from typing import List, Dict, Any, Callable, Optional
from openai import OpenAI
from config import settings

logger = logging.getLogger("chatbot.agent.specialist")

def python_type_to_json_type(py_type) -> str:
    if py_type == int:
        return "integer"
    elif py_type == float:
        return "number"
    elif py_type == bool:
        return "boolean"
    elif py_type in (list, List):
        return "array"
    elif py_type in (dict, Dict):
        return "object"
    return "string"

def function_to_tool_schema(func: Callable) -> Dict[str, Any]:
    """Tự động chuyển đổi Python function thành OpenAI tool definition schema."""
    sig = inspect.signature(func)
    doc = func.__doc__ or f"Thực thi hàm {func.__name__}"

    properties = {}
    required = []

    for param_name, param in sig.parameters.items():
        param_type = param.annotation if param.annotation != inspect.Parameter.empty else str
        json_type = python_type_to_json_type(param_type)

        param_info = {"type": json_type, "description": f"Tham số {param_name}"}
        if json_type == "array":
            param_info["items"] = {"type": "string"}

        properties[param_name] = param_info
        if param.default == inspect.Parameter.empty:
            required.append(param_name)

    return {
        "type": "function",
        "function": {
            "name": func.__name__,
            "description": doc.strip(),
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required
            }
        }
    }

class SpecialistAgent:
    """Agent chuyên trách với System Prompt riêng biệt và danh sách công cụ được phân quyền chặt chẽ."""

    def __init__(self, name: str, system_prompt: str, tools: List[Callable] = None):
        self.name = name
        self.system_prompt = system_prompt
        self.tool_map: Dict[str, Callable] = {f.__name__: f for f in (tools or [])}
        self.tool_schemas = [function_to_tool_schema(f) for f in (tools or [])]
        self.client = None

        if settings.CLOUD_API_KEY:
            self.client = OpenAI(
                api_key=settings.CLOUD_API_KEY,
                base_url=settings.CLOUD_MODEL_URL
            )

    def run(
        self,
        user_message: str,
        chat_history: List[Dict[str, Any]] = None,
        context_prompt: str = "",
        user_context: Optional[Dict[str, Any]] = None,
        max_iterations: int = 5,
        parent_span: Any = None
    ) -> Dict[str, Any]:
        """Thực thi chu trình Agent: Prompt -> DeepSeek LLM -> Tool Calls -> Output."""
        if not self.client:
            return {
                "content": "Hệ thống chưa được cấu hình CLOUD_API_KEY trong file .env.",
                "tool_calls_executed": []
            }

        # 1. Chuẩn bị messages
        full_system = f"{self.system_prompt}\n\n{context_prompt}"
        messages = [{"role": "system", "content": full_system}]

        # Gắn lịch sử hội thoại gần nhất (loại bỏ tin nhắn hiện tại nếu đã được lưu vào database trước đó)
        if chat_history:
            filtered_history = [
                h for h in chat_history
                if not (h.get("role") == "user" and h.get("content") == user_message)
            ]
            for h in filtered_history[-6:]:
                role = h.get("role")
                content = h.get("content")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": user_message})

        tools_arg = self.tool_schemas if self.tool_schemas else None
        tool_calls_executed = []

        # 2. Vòng lặp function calling
        for iteration in range(max_iterations):
            try:
                response = self.client.chat.completions.create(
                    model=settings.CLOUD_MODEL_NAME,
                    messages=messages,
                    tools=tools_arg,
                    tool_choice="auto" if tools_arg else None,
                    temperature=0.3
                )
                assistant_message = response.choices[0].message
            except Exception as e:
                logger.error(f"Error calling DeepSeek API for agent {self.name}: {e}")
                return {
                    "content": f"Dạ, em gặp trục trặc tạm thời khi kết nối máy chủ AI: {e}. Anh/chị vui lòng thử lại sau giây lát ạ.",
                    "tool_calls_executed": tool_calls_executed
                }

            # Nếu có tool calls
            if assistant_message.tool_calls:
                # Thêm tin nhắn assistant có tool_calls vào messages
                messages.append(assistant_message)

                for tc in assistant_message.tool_calls:
                    fn_name = tc.function.name
                    fn_args_str = tc.function.arguments

                    try:
                        fn_args = json.loads(fn_args_str) if fn_args_str else {}
                    except Exception:
                        fn_args = {}

                    # Tự động inject user_id nếu tool cần mà LLM chưa biết hoặc user đang login
                    if "user_id" in fn_args and user_context and not fn_args["user_id"]:
                        fn_args["user_id"] = user_context.get("user_id")
                    elif "user_id" not in fn_args and user_context and "user_id" in inspect.signature(self.tool_map.get(fn_name, lambda: None)).parameters:
                        fn_args["user_id"] = user_context.get("user_id")

                    logger.info(f"Agent {self.name} calling tool: {fn_name} with args: {fn_args}")

                    # Monitor tool call via Langfuse Span
                    tool_span = None
                    if parent_span and hasattr(parent_span, "span"):
                        tool_span = parent_span.span(
                            name=f"tool_{fn_name}",
                            as_type="tool",
                            input=fn_args,
                            metadata={"agent": self.name, "tool_name": fn_name, "call_id": tc.id}
                        )

                    tool_fn = self.tool_map.get(fn_name)
                    if tool_fn:
                        try:
                            result = tool_fn(**fn_args)
                        except Exception as ex:
                            result = {"error": f"Lỗi thực thi tool {fn_name}: {str(ex)}"}
                    else:
                        result = {"error": f"Tool {fn_name} không thuộc quyền hạn của agent {self.name}"}

                    # Ghi nhận kết quả tool trả về vào Langfuse Span
                    if tool_span:
                        tool_span.end(output=result)

                    tool_calls_executed.append({
                        "tool": fn_name,
                        "arguments": fn_args,
                        "result": result
                    })

                    # Thêm kết quả tool vào messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result, ensure_ascii=False)
                    })

                # Tiếp tục vòng lặp để LLM tổng hợp câu trả lời
                continue

            # Nếu không gọi thêm tool nào -> Kết thúc
            final_content = assistant_message.content or "Dạ, em đã xử lý xong yêu cầu của anh/chị ạ."
            return {
                "content": final_content,
                "tool_calls_executed": tool_calls_executed
            }

        # Nếu vòng lặp đạt tối đa mà vừa chạy tool xong, thực hiện 1 cuộc gọi tổng kết không dùng tools
        if tool_calls_executed:
            try:
                final_res = self.client.chat.completions.create(
                    model=settings.CLOUD_MODEL_NAME,
                    messages=messages,
                    temperature=0.3
                )
                final_text = final_res.choices[0].message.content or "Dạ, em đã xử lý xong yêu cầu của anh/chị ạ."
                return {
                    "content": final_text,
                    "tool_calls_executed": tool_calls_executed
                }
            except Exception as e:
                logger.error(f"Error in final summary completion for agent {self.name}: {e}")

        return {
            "content": "Dạ, em đã kiểm tra thông tin. Anh/chị cần em hỗ trợ thêm gì về suất chiếu hoặc ghế ngồi nữa không ạ?",
            "tool_calls_executed": tool_calls_executed
        }
