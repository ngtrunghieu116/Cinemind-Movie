import axios from 'axios';

const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001';

export const sendChatMessage = async (message, sessionId = null, currentUser = null) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    let user = currentUser;
    if (!user) {
        try {
            user = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            user = {};
        }
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
        message,
        session_id: sessionId,
        user_id: user?.id || null
    };

    const response = await axios.post(`${CHATBOT_API_URL}/api/chat`, payload, { headers });
    return response.data;
};

export const getChatHistory = async (sessionId) => {
    if (!sessionId) return { messages: [] };
    const response = await axios.get(`${CHATBOT_API_URL}/api/chat/history/${sessionId}`);
    return response.data;
};

export const getUserSessions = async (userId = null) => {
    let uid = userId;
    if (!uid) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            uid = user?.id || null;
        } catch {
            uid = null;
        }
    }
    if (!uid) {
        return { sessions: [], total: 0, stats: {} };
    }
    const response = await axios.get(`${CHATBOT_API_URL}/api/chat/sessions`, { params: { user_id: uid } });
    return response.data;
};

export const deleteChatSession = async (sessionId) => {
    const response = await axios.delete(`${CHATBOT_API_URL}/api/chat/sessions/${sessionId}`);
    return response.data;
};

export default {
    sendChatMessage,
    getChatHistory,
    getUserSessions,
    deleteChatSession
};
