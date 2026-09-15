/**
 * Chuyển đổi đường dẫn ảnh tương đối (ví dụ /uploads/products/...) thành URL tuyệt đối trỏ tới Backend Server (http://localhost:8080)
 * @param {string} path - Đường dẫn ảnh từ Backend
 * @returns {string} URL tuyệt đối để thẻ <img> tải ảnh trực tiếp từ Backend
 */
export const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${serverBase}${cleanPath}`;
};

export default getFullImageUrl;
