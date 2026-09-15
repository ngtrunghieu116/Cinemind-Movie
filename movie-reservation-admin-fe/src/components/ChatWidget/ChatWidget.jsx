import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    X,
    Send,
    Sparkles,
    Bot,
    User as UserIcon,
    ArrowUpRight,
    RefreshCw,
    History,
    Plus,
    Trash2,
    Film,
    Calendar,
    ChevronLeft,
    Clock
} from 'lucide-react';
import {
    sendChatMessage,
    getChatHistory,
    getUserSessions,
    deleteChatSession
} from './chatApi';
import MarkdownMessage from './MarkdownMessage';

const QUICK_PROMPTS = [
    { label: '🎬 Phim đang chiếu', prompt: 'Hôm nay rạp có những phim nào đang chiếu?' },
    { label: '📅 Lịch chiếu hôm nay', prompt: 'Cho tôi xem lịch chiếu các phim hôm nay' },
    { label: '🍿 Giá combo bắp nước', prompt: 'Rạp có những combo bắp nước nào và giá bao nhiêu?' },
    { label: '🎟️ Vé của tôi', prompt: 'Cho tôi kiểm tra danh sách vé tôi đã đặt' }
];

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [sessionsList, setSessionsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Khởi tạo hoặc khôi phục sessionId từ sessionStorage
    useEffect(() => {
        let storedSessionId = sessionStorage.getItem('cinemind_chat_session');
        if (!storedSessionId) {
            storedSessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
            sessionStorage.setItem('cinemind_chat_session', storedSessionId);
        }
        setSessionId(storedSessionId);
        loadSessionMessages(storedSessionId);
    }, []);

    useEffect(() => {
        if (isOpen && !showHistory) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, loading, showHistory]);

    const loadSessionMessages = (targetSessionId) => {
        getChatHistory(targetSessionId)
            .then((res) => {
                if (res.messages && res.messages.length > 0) {
                    setMessages(res.messages);
                } else {
                    setMessages([
                        {
                            role: 'assistant',
                            content: 'Xin chào! Em là **CineBot** 🎬 - trợ lý thông minh của rạp chiếu phim CineMind.\n\nEm có thể hỗ trợ anh/chị:\n- 🎬 **Khám phá phim** đang chiếu & sắp chiếu, tóm tắt cốt truyện\n- 📅 **Tra cứu lịch chiếu**, giá vé theo từng khung giờ\n- 💺 **Kiểm tra sơ đồ ghế** và hỗ trợ đặt vé giữ chỗ\n- 🍿 **Xem bảng giá combo** bắp rang & nước uống F&B\n- 🎟️ **Tra cứu & huỷ vé** đã đặt chỗ\n\nAnh/chị cần em hỗ trợ gì hôm nay ạ?',
                            agent_name: 'discovery_agent'
                        }
                    ]);
                }
            })
            .catch(() => {
                setMessages([
                    {
                        role: 'assistant',
                        content: 'Xin chào! Em là **CineBot** 🎬 - trợ lý thông minh của rạp chiếu phim CineMind. Anh/chị cần em hỗ trợ tìm phim hay xem lịch chiếu hôm nay không ạ?',
                        agent_name: 'discovery_agent'
                    }
                ]);
            });
    };

    const fetchSessions = async () => {
        setLoadingHistory(true);
        try {
            const data = await getUserSessions();
            setSessionsList(data.sessions || []);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleOpenHistory = () => {
        setShowHistory(true);
        fetchSessions();
    };

    const handleSelectSession = (id) => {
        sessionStorage.setItem('cinemind_chat_session', id);
        setSessionId(id);
        setShowHistory(false);
        loadSessionMessages(id);
    };

    const handleDeleteSession = async (e, idToDelete) => {
        e.stopPropagation();
        try {
            await deleteChatSession(idToDelete);
            setSessionsList((prev) => prev.filter((s) => s.id !== idToDelete));
            if (sessionId === idToDelete) {
                handleNewChat();
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const handleSend = async (textToSend = null) => {
        const query = textToSend || input;
        if (!query || !query.trim()) return;

        const userMsg = { role: 'user', content: query.trim() };
        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInput('');
        setLoading(true);

        try {
            const data = await sendChatMessage(query.trim(), sessionId);
            const botMsg = {
                role: 'assistant',
                content: data.reply,
                agent_name: data.agent_used,
                route_action: data.route_action
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = {
                role: 'assistant',
                content: 'Dạ, hiện tại dịch vụ chatbot đang khởi động hoặc tạm thời chưa kết nối được server (cổng 8001). Anh/chị vui lòng kiểm tra xem backend chatbot đã chạy chưa ạ.',
                agent_name: 'safe_guard'
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        const newId = 'sess_' + Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem('cinemind_chat_session', newId);
        setSessionId(newId);
        setShowHistory(false);
        setMessages([
            {
                role: 'assistant',
                content: 'Cuộc trò chuyện mới đã sẵn sàng! 🎬 Anh/chị muốn tìm phim hay kiểm tra lịch chiếu hôm nay ạ?',
                agent_name: 'discovery_agent'
            }
        ]);
    };

    const getAgentBadge = (agentName) => {
        switch (agentName) {
            case 'showtime_booking_agent':
                return <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-medium shadow-2xs">Lịch chiếu & Đặt vé</span>;
            case 'ticket_support_agent':
                return <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium shadow-2xs">Hỗ trợ vé</span>;
            case 'navigation_agent':
                return <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-full font-medium shadow-2xs">Điều hướng</span>;
            case 'safe_guard':
                return <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-full font-medium shadow-2xs">Kiểm duyệt</span>;
            default:
                return <span className="text-[10px] bg-red-50 text-red-700 border border-red-200/80 px-2 py-0.5 rounded-full font-medium shadow-2xs">Khám phá phim</span>;
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group focus:outline-none ring-4 ring-red-500/20"
                    title="Mở CineBot AI Assistant"
                >
                    <div className="relative">
                        <Bot className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>
                    <span className="font-bold text-sm tracking-wide">CineBot AI</span>
                </button>
            )}

            {/* Chat Modal Box */}
            {isOpen && (
                <div className="w-[440px] sm:w-[470px] h-[630px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-md shadow-red-600/40">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                                    CineBot AI
                                </h3>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                    Trợ lý rạp phim trực tuyến
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={showHistory ? () => setShowHistory(false) : handleOpenHistory}
                                className={`p-1.5 rounded-lg transition ${showHistory ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                title={showHistory ? 'Quay lại đoạn chat' : 'Lịch sử trò chuyện'}
                            >
                                <History size={17} />
                            </button>
                            <button
                                onClick={handleNewChat}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                title="Bắt đầu cuộc trò chuyện mới"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                title="Thu nhỏ"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* View: Danh Sách Lịch Sử Trò Chuyện */}
                    {showHistory ? (
                        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition"
                                >
                                    <ChevronLeft size={16} />
                                    Quay lại chat
                                </button>
                                <button
                                    onClick={handleNewChat}
                                    className="flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200/80 transition"
                                >
                                    <Plus size={14} />
                                    Cuộc trò chuyện mới
                                </button>
                            </div>

                            <div className="flex-1 p-3 overflow-y-auto space-y-2">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                                    Các cuộc trò chuyện gần đây ({sessionsList.length})
                                </div>

                                {loadingHistory ? (
                                    <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                                        <RefreshCw size={14} className="animate-spin text-red-600" />
                                        Đang tải danh sách lịch sử...
                                    </div>
                                ) : sessionsList.length === 0 ? (
                                    <div className="text-center py-10 text-xs text-slate-400">
                                        <History size={28} className="mx-auto text-slate-300 mb-2" />
                                        Chưa có cuộc trò chuyện nào trước đây.
                                    </div>
                                ) : (
                                    sessionsList.map((s) => {
                                        const isCurrent = s.id === sessionId;
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSelectSession(s.id)}
                                                className={`group p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${isCurrent
                                                    ? 'bg-red-50/80 border-red-200 text-red-950 shadow-2xs'
                                                    : 'bg-white border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold truncate text-slate-800 flex items-center gap-1.5">
                                                        <MessageCircle size={13} className={isCurrent ? 'text-red-600' : 'text-slate-400'} />
                                                        <span className="truncate">{s.preview || s.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={11} />
                                                            {s.updated_at ? new Date(s.updated_at).toLocaleDateString('vi-VN') : 'Gần đây'}
                                                        </span>
                                                        {s.message_count ? (
                                                            <span>• {s.message_count} tin nhắn</span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => handleDeleteSession(e, s.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                    title="Xóa cuộc trò chuyện này"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        /* View: Giao Diện Chat Chính */
                        <>
                            {/* Messages Container */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-sm">
                                {messages.map((m, idx) => {
                                    const isUser = m.role === 'user';
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="flex items-start gap-2 max-w-[88%]">
                                                {!isUser && (
                                                    <div className="w-7 h-7 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-200/50">
                                                        <Bot size={15} />
                                                    </div>
                                                )}

                                                <div className="flex flex-col">
                                                    {!isUser && m.agent_name && (
                                                        <div className="mb-1 flex items-center gap-1.5">
                                                            {getAgentBadge(m.agent_name)}
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`p-3.5 rounded-2xl ${isUser
                                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-xs shadow-sm shadow-red-600/20 text-[13px] leading-relaxed font-normal'
                                                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                                                            }`}
                                                    >
                                                        {isUser ? (
                                                            <div className="whitespace-pre-wrap">{m.content}</div>
                                                        ) : (
                                                            /* Render Rich Markdown */
                                                            <MarkdownMessage content={m.content} />
                                                        )}
                                                    </div>

                                                    {/* Thẻ Route Action nếu có */}
                                                    {!isUser && m.route_action && (
                                                        <div className="mt-2 bg-gradient-to-r from-red-50 via-orange-50/50 to-white border border-red-200/90 rounded-xl p-3 flex items-center justify-between shadow-xs">
                                                            <div className="text-xs">
                                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                    <Sparkles size={13} className="text-red-600" />
                                                                    {m.route_action.title || 'Chuyển trang'}
                                                                </div>
                                                                <p className="text-slate-500 text-[11px] mt-0.5">{m.route_action.description || m.route_action.route}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    navigate(m.route_action.route);
                                                                    setIsOpen(false);
                                                                }}
                                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition shadow-xs flex-shrink-0 ml-2"
                                                            >
                                                                Đi tới
                                                                <ArrowUpRight size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {loading && (
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <div className="w-7 h-7 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center border border-red-200/50">
                                            <Bot size={15} />
                                        </div>
                                        <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                                            <span className="ml-1 text-slate-500 text-[12px]">CineBot đang chuẩn bị câu trả lời...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Suggestion Pills */}
                            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                {QUICK_PROMPTS.map((qp, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(qp.prompt)}
                                        disabled={loading}
                                        className="text-[11px] font-medium whitespace-nowrap bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 px-2.5 py-1.5 rounded-full border border-slate-200/80 transition flex-shrink-0 active:scale-95"
                                    >
                                        {qp.label}
                                    </button>
                                ))}
                            </div>

                            {/* Input Form */}
                            <div className="p-3 bg-white border-t border-slate-200">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Hỏi phim, lịch chiếu, đặt vé..."
                                        disabled={loading}
                                        className="flex-1 text-[13px] bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        className="p-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition flex items-center justify-center shadow-md shadow-red-600/20 active:scale-95"
                                        title="Gửi tin nhắn"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
