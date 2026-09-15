import axios from 'axios';

const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001';

export const sendChatMessage = async (message, sessionId = null) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
        message,
        session_id: sessionId,
        user_id: user.id || null
    };

    const response = await axios.post(`${CHATBOT_API_URL}/api/chat`, payload, { headers });
    return response.data;
};

export const getChatHistory = async (sessionId) => {
    if (!sessionId) return { messages: [] };
    const response = await axios.get(`${CHATBOT_API_URL}/api/chat/history/${sessionId}`);
    return response.data;
};

export const getUserSessions = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const params = {};
    if (user && user.id) {
        params.user_id = user.id;
    }
    const response = await axios.get(`${CHATBOT_API_URL}/api/chat/sessions`, { params });
    return response.data;
};

export const deleteChatSession = async (sessionId) => {
    const response = await axios.delete(`${CHATBOT_API_URL}/api/chat/sessions/${sessionId}`);
    return response.data;
};
