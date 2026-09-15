import axiosClient from './axiosClient';

/**
 * API client cho Products (F&B / Bắp nước / Combo).
 */
export const productApi = {
    /**
     * Lấy danh sách sản phẩm F&B đang bán công khai
     */
    getProducts: () => {
        return axiosClient.get('/products');
    }
};

export default productApi;
