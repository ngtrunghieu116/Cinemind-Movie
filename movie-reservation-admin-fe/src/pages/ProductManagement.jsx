import React, { useState, useEffect } from 'react';
import productApi from '../api/productApi';
import Pagination from '../components/Pagination';
import {
    Edit,
    Trash2,
    Plus,
    Search,
    Image as ImageIcon,
    Filter,
    RotateCcw,
    X,
    Eye,
    Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Pagination States
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [isActive, setIsActive] = useState('');
    const [sort, setSort] = useState('displayOrder,asc');

    const [pageNo, setPageNo] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    // Preview state
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewProduct, setPreviewProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [pageNo, pageSize, search, category, isActive, sort]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page: pageNo,
                size: pageSize,
                sort: sort
            };
            if (search.trim()) params.search = search.trim();
            if (category) params.category = category;
            if (isActive !== '') params.isActive = isActive;

            const data = await productApi.getAll(params);

            if (data && data.content !== undefined) {
                setProducts(data.content);
                setTotalElements(data.totalElements);
                setTotalPages(data.totalPages);
            } else {
                setProducts(data);
                setTotalElements(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách sản phẩm. ' + (err.response?.data?.message || ''));
            toast.error('Lỗi khi tải dữ liệu sản phẩm!');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct({ ...product });
            setIsEditing(true);
            setPreviewImage(product.imagePath ? `http://localhost:8080${product.imagePath}` : null);
        } else {
            setCurrentProduct({
                name: '',
                category: 'FOOD',
                description: '',
                price: '',
                availableQuantity: 0,
                isActive: true,
                displayOrder: 0
            });
            setIsEditing(false);
            setPreviewImage(null);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setImageFile(null);
        setPreviewImage(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Kích thước ảnh tối đa là 2MB!');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (currentProduct.price <= 0) {
            toast.error('Giá sản phẩm phải lớn hơn 0');
            return;
        }
        if (currentProduct.availableQuantity < 0) {
            toast.error('Số lượng tồn kho không được âm');
            return;
        }
        if (currentProduct.name.trim() === '') {
            toast.error('Tên sản phẩm không được rỗng');
            return;
        }

        const formData = new FormData();
        formData.append('name', currentProduct.name);
        formData.append('category', currentProduct.category);
        formData.append('description', currentProduct.description || '');
        formData.append('price', currentProduct.price);
        formData.append('availableQuantity', currentProduct.availableQuantity);
        formData.append('isActive', currentProduct.isActive);
        formData.append('displayOrder', currentProduct.displayOrder);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (isEditing) {
                await productApi.update(currentProduct.id, formData);
                toast.success('Cập nhật sản phẩm thành công!');
            } else {
                if (!imageFile) {
                    toast.error('Vui lòng chọn ảnh cho sản phẩm mới!');
                    return;
                }
                await productApi.create(formData);
                toast.success('Tạo mới sản phẩm thành công!');
            }
            fetchProducts();
            handleCloseModal();
        } catch (err) {
            toast.error('Lỗi: ' + (err.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn ngưng kinh doanh sản phẩm này? (Soft Delete)')) {
            try {
                await productApi.delete(id);
                toast.success('Đã ngưng kinh doanh sản phẩm!');
                fetchProducts();
            } catch (err) {
                toast.error('Không thể xóa sản phẩm: ' + (err.response?.data?.message || ''));
            }
        }
    };

    const openPreview = (product) => {
        setPreviewProduct(product);
        setIsPreviewOpen(true);
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategory('');
        setIsActive('');
        setPageNo(0);
    };

    const getStatusBadge = (product) => {
        if (!product.isActive) {
            return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">● Ngừng bán</span>;
        }
        if (product.availableQuantity === 0) {
            return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">● Hết hàng</span>;
        }
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">● Đang kinh doanh</span>;
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'FOOD':
                return <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">Đồ Ăn</span>;
            case 'DRINK':
                return <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200">Nước Uống</span>;
            case 'COMBO':
                return <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">Combo Bắp Nước</span>;
            default:
                return <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">{category}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản Lý Thực Đơn</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <Plus size={18} /> Thêm Sản Phẩm
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider w-full mb-1">
                    <Filter size={14} /> Bộ Lọc Tìm Kiếm
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Tên sản phẩm
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên sản phẩm..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPageNo(0); }}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Phân loại
                    </label>
                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPageNo(0); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    >
                        <option value="">-- Tất cả danh mục --</option>
                        <option value="FOOD">Đồ Ăn (Food)</option>
                        <option value="DRINK">Nước Uống (Drink)</option>
                        <option value="COMBO">Combo Bắp Nước</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Trạng thái kinh doanh
                    </label>
                    <select
                        value={isActive}
                        onChange={(e) => { setIsActive(e.target.value); setPageNo(0); }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    >
                        <option value="">-- Tất cả trạng thái --</option>
                        <option value="true">Đang kinh doanh</option>
                        <option value="false">Ngừng bán (Inactive)</option>
                    </select>
                </div>

                {/* Clear Filters */}
                {(search || category || isActive !== '') && (
                    <button
                        onClick={handleClearFilters}
                        className="px-3.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <RotateCcw size={14} /> Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 m-4 rounded-lg text-sm font-medium">{error}</div>}

                {loading ? (
                    <div className="flex justify-center items-center py-16 text-gray-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Đang tải thực đơn F&B...
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Hình Ảnh</th>
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => setSort(sort === 'name,asc' ? 'name,desc' : 'name,asc')}>
                                            Tên Sản Phẩm {sort.startsWith('name') ? (sort.endsWith('asc') ? '↑' : '↓') : ''}
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Phân Loại</th>
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer" onClick={() => setSort(sort === 'price,asc' ? 'price,desc' : 'price,asc')}>
                                            Đơn Giá {sort.startsWith('price') ? (sort.endsWith('asc') ? '↑' : '↓') : ''}
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tồn Kho</th>
                                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng Thái</th>
                                        <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12 text-gray-400 font-medium">Không tìm thấy sản phẩm nào.</td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id} className="hover:bg-blue-50/30 transition-colors duration-150 cursor-pointer" onClick={() => openPreview(product)}>
                                                <td className="px-6 py-3.5">
                                                    {product.imagePath ? (
                                                        <img src={`http://localhost:8080${product.imagePath}`} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-2xs" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200"><ImageIcon size={20} /></div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5 font-semibold text-gray-800">{product.name}</td>
                                                <td className="px-6 py-3.5">{getCategoryBadge(product.category)}</td>
                                                <td className="px-6 py-3.5 font-bold text-blue-600">{Number(product.price).toLocaleString('vi-VN')} đ</td>
                                                <td className="px-6 py-3.5 font-medium text-gray-700">{product.availableQuantity}</td>
                                                <td className="px-6 py-3.5">{getStatusBadge(product)}</td>
                                                <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openPreview(product)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer" title="Xem chi tiết">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleOpenModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Chỉnh sửa">
                                                            <Edit size={16} />
                                                        </button>
                                                        {product.isActive && (
                                                            <button onClick={(e) => handleDelete(product.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Ngừng bán">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            pageNo={pageNo}
                            pageSize={pageSize}
                            totalElements={totalElements}
                            totalPages={totalPages}
                            onPageChange={setPageNo}
                            onPageSizeChange={(newSize) => { setPageSize(newSize); setPageNo(0); }}
                        />
                    </>
                )}
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && previewProduct && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setIsPreviewOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-gray-100" onClick={e => e.stopPropagation()}>
                        <div className="relative h-64 bg-gray-100">
                            {previewProduct.imagePath ? (
                                <img src={`http://localhost:8080${previewProduct.imagePath}`} alt={previewProduct.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={48} /></div>
                            )}
                            <div className="absolute top-4 right-4">{getStatusBadge(previewProduct)}</div>
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute top-4 left-4 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 text-center space-y-2">
                            <div className="text-xs font-bold tracking-widest uppercase">{getCategoryBadge(previewProduct.category)}</div>
                            <h2 className="text-xl font-bold text-gray-800">{previewProduct.name}</h2>
                            <p className="text-blue-600 font-extrabold text-2xl">{Number(previewProduct.price).toLocaleString('vi-VN')} đ</p>
                            <p className="text-gray-500 text-sm mt-3">{previewProduct.description || 'Chưa có mô tả'}</p>
                            <div className="mt-6 flex justify-center gap-6 text-xs text-gray-600 border-t border-gray-100 pt-4">
                                <div>Tồn kho: <strong className="text-gray-800 font-bold">{previewProduct.availableQuantity}</strong></div>
                                <div>Thứ tự hiển thị: <strong className="text-gray-800 font-bold">#{previewProduct.displayOrder}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Add/Edit */}
            {isModalOpen && currentProduct && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-100">
                        <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-red-600" />
                                {isEditing ? 'Cập Nhật Sản Phẩm F&B' : 'Thêm Sản Phẩm Mới'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Sản Phẩm <span className="text-red-500">*</span></label>
                                            <input type="text" required className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={currentProduct.name} onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Danh Mục <span className="text-red-500">*</span></label>
                                            <select required className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={currentProduct.category} onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}>
                                                <option value="FOOD">Đồ ăn (Food)</option>
                                                <option value="DRINK">Nước uống (Drink)</option>
                                                <option value="COMBO">Combo Bắp Nước</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Giá Bán (VNĐ) <span className="text-red-500">*</span></label>
                                                <input type="number" required min="0" step="1000" className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={currentProduct.price} onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Tồn Kho <span className="text-red-500">*</span></label>
                                                <input type="number" required min="0" className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={currentProduct.availableQuantity} onChange={(e) => setCurrentProduct({ ...currentProduct, availableQuantity: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Thứ Tự Hiển Thị</label>
                                            <input type="number" required min="0" className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={currentProduct.displayOrder} onChange={(e) => setCurrentProduct({ ...currentProduct, displayOrder: e.target.value })} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-4">
                                            <input type="checkbox" id="isActive" checked={currentProduct.isActive} onChange={(e) => setCurrentProduct({ ...currentProduct, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                                            <label htmlFor="isActive" className="text-xs font-semibold text-gray-700 cursor-pointer">Đang kinh doanh</label>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/3 flex flex-col items-center gap-3">
                                        <label className="block text-xs font-semibold text-gray-700 self-start">Hình Ảnh {isEditing ? '' : '*'}</label>
                                        <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50 relative group hover:border-blue-400 transition-colors">
                                            {previewImage ? (
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-gray-400 flex flex-col items-center">
                                                    <ImageIcon size={32} className="mb-2" />
                                                    <span className="text-xs font-medium">Chọn ảnh</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                        <p className="text-xs text-gray-400">JPG, PNG, WEBP (Tối đa 2MB)</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mô Tả</label>
                                    <textarea rows="3" className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={currentProduct.description || ''} onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-all cursor-pointer">Hủy</button>
                            <button type="submit" form="productForm" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-95 cursor-pointer">{isEditing ? 'Cập Nhật' : 'Tạo Mới'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
