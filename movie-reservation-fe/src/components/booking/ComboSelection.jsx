import { useState, useEffect, useCallback } from 'react';
import { Popcorn, Plus, Minus, Check, AlertCircle, ShoppingBag, Loader2, Coffee, Sparkles } from 'lucide-react';
import { productApi } from '../../api/productApi';
import { reservationApi } from '../../api/reservationApi';
import { getFullImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { key: 'ALL', label: 'Tất cả', icon: Sparkles },
    { key: 'COMBO', label: 'Combo Phim', icon: Popcorn },
    { key: 'DRINK', label: 'Nước Ngọt', icon: Coffee },
    { key: 'SINGLE', label: 'Bắp Lẻ', icon: Popcorn },
];

const CATEGORY_META = {
    COMBO: {
        label: 'Combo Tiết Kiệm',
        color: 'text-red-600',
        bg: 'bg-red-50',
        badgeBg: 'bg-red-50 text-red-700 border-red-200',
        icon: Popcorn
    },
    DRINK: {
        label: 'Nước Ngọt',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Coffee
    },
    SINGLE: {
        label: 'Bắp Lẻ',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Popcorn
    },
    FOOD: {
        label: 'Bắp Lẻ & Đồ Ăn',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Popcorn
    }
};

export const ComboSelection = ({
    reservationId,
    reservationData,
    onReservationUpdate,
    fnbItems: propFnbItems,
    onUpdateItem,
    disabled = false
}) => {
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [mutatingProductIds, setMutatingProductIds] = useState(new Set());

    const itemsList = reservationData?.items || propFnbItems || [];

    const fetchProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        setLoadError(null);

        try {
            const data = await productApi.getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load FnB products:', err);
            setLoadError(err.message || 'Không thể tải danh sách bắp nước.');
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const currentMap = itemsList.reduce((acc, item) => {
        const pId = item.productId || item.id;
        if (pId) {
            acc[pId] = item;
        }
        return acc;
    }, {});

    const handleQuantityChange = async (product, targetQty) => {
        if (!reservationId || disabled || mutatingProductIds.has(product.id)) return;

        setMutatingProductIds(prev => new Set(prev).add(product.id));

        try {
            const existingItem = itemsList.find(i => (i.productId || i.id) === product.id);

            if (onUpdateItem) {
                await onUpdateItem({
                    productId: product.id,
                    quantity: targetQty,
                    name: product.name,
                    price: product.price
                });
            } else {
                if (targetQty <= 0) {
                    if (existingItem) {
                        const itemId = existingItem.itemId || existingItem.id;
                        await reservationApi.removeCombo(reservationId, itemId);
                    }
                } else if (existingItem) {
                    const itemId = existingItem.itemId || existingItem.id;
                    await reservationApi.updateCombo(reservationId, itemId, { quantity: targetQty });
                } else {
                    await reservationApi.addCombo(reservationId, { productId: product.id, quantity: targetQty });
                }

                // Call reviewReservation to get fresh total and items
                const updated = await reservationApi.reviewReservation(reservationId);
                if (onReservationUpdate) {
                    onReservationUpdate(updated);
                }
            }
        } catch (err) {
            console.error('Quantity update failed:', err);
            toast.error(err.message || 'Không thể cập nhật số lượng bắp nước.');
        } finally {
            setMutatingProductIds(prev => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
            });
        }
    };

    const isCategoryMatch = (productCat, filterKey) => {
        if (filterKey === 'ALL') return true;
        const cat = (productCat || 'COMBO').toUpperCase();
        if (filterKey === 'SINGLE') return cat === 'FOOD' || cat === 'SINGLE';
        return cat === filterKey;
    };

    const filteredProducts = activeCategory === 'ALL'
        ? products
        : products.filter(p => isCategoryMatch(p.category, activeCategory));

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const orderA = a.displayOrder != null ? a.displayOrder : 999;
        const orderB = b.displayOrder != null ? b.displayOrder : 999;
        return orderA - orderB;
    });

    const totalSelectedCount = itemsList.reduce((sum, i) => sum + (i.quantity || 0), 0);

    return (
        <div className="w-full space-y-6 font-sans">
            
            {/* Header with Title & Context Note */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                        <Popcorn className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-bold text-slate-900">Combo & Bắp Nước Rạp</h2>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-semibold uppercase tracking-wider">
                                Tùy chọn
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Thưởng thức bắp rang bơ nóng giòn & nước ngọt mát lạnh trong suốt bộ phim
                        </p>
                    </div>
                </div>

                {/* Selected Counter & Note */}
                <div className="flex items-center space-x-3 self-start md:self-auto">
                    {totalSelectedCount > 0 && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center space-x-1.5 shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chọn {totalSelectedCount} món</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.key;
                    const count = cat.key === 'ALL'
                        ? products.length
                        : products.filter(p => isCategoryMatch(p.category, cat.key)).length;

                    return (
                        <button
                            key={cat.key}
                            type="button"
                            onClick={() => setActiveCategory(cat.key)}
                            className={`
                                px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all duration-200 border whitespace-nowrap cursor-pointer
                                ${isActive
                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:text-slate-900 shadow-xs'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                            <span>{cat.label}</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Loading State */}
            {isLoadingProducts && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4 animate-pulse shadow-sm">
                            <div className="w-full aspect-[16/10] bg-slate-100 rounded-xl" />
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-100 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-full" />
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <div className="h-5 bg-slate-100 rounded w-20" />
                                <div className="h-8 bg-slate-100 rounded w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!isLoadingProducts && loadError && (
                <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 max-w-md mx-auto shadow-xl">
                    <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900">Không thể tải bắp nước</h3>
                    <p className="text-xs text-slate-500">{loadError}</p>
                    <button
                        type="button"
                        onClick={fetchProducts}
                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-600/20"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoadingProducts && !loadError && sortedProducts.length === 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-3 max-w-lg mx-auto shadow-sm">
                    <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
                    <h3 className="text-sm font-bold text-slate-900">Chưa có sản phẩm trong danh mục này</h3>
                    <p className="text-xs text-slate-500">
                        Bạn có thể chọn danh mục khác hoặc bấm <span className="text-slate-900 font-semibold">Tiếp tục</span> để chuyển sang bước thanh toán vé.
                    </p>
                </div>
            )}

            {/* Product Grid */}
            {!isLoadingProducts && !loadError && sortedProducts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {sortedProducts.map(product => {
                        const item = currentMap[product.id];
                        const qty = item?.quantity || 0;
                        const isMutating = mutatingProductIds.has(product.id);
                        const isSoldOut = product.availableQuantity != null && product.availableQuantity <= 0;
                        const isMaxed = product.availableQuantity != null && qty >= product.availableQuantity;
                        const categoryMeta = CATEGORY_META[product.category] || CATEGORY_META.COMBO;
                        const CategoryIcon = categoryMeta.icon;

                        return (
                            <div
                                key={product.id}
                                className={`
                                    group relative flex flex-col justify-between bg-white border rounded-2xl p-4 transition-all duration-300 shadow-sm overflow-hidden
                                    ${qty > 0
                                        ? 'border-red-600 bg-red-50/20 shadow-md ring-1 ring-red-600/30'
                                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                                    }
                                    ${isSoldOut ? 'opacity-60' : ''}
                                    ${disabled ? 'pointer-events-none opacity-60' : ''}
                                `}
                            >
                                {/* Top Image & Badges */}
                                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-200/60">
                                    {product.imagePath ? (
                                        <img
                                            src={getFullImageUrl(product.imagePath)}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}

                                    {/* Fallback Graphic */}
                                    <div 
                                        style={{ display: product.imagePath ? 'none' : 'flex' }}
                                        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-50"
                                    >
                                        <CategoryIcon className={`w-12 h-12 ${categoryMeta.color} opacity-80 mb-1`} />
                                        <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">Cinemind Concession</span>
                                    </div>

                                    {/* Category Tag (Top-Left) */}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border backdrop-blur-md ${categoryMeta.badgeBg}`}>
                                            {categoryMeta.label}
                                        </span>
                                    </div>

                                    {/* Quantity Badge (Top-Right) */}
                                    {qty > 0 && (
                                        <div className="absolute top-2.5 right-2.5">
                                            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-xs font-bold font-mono shadow-md flex items-center space-x-1">
                                                <span>×</span>
                                                <span>{qty}</span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Sold Out Overlay */}
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                                            <span className="px-3 py-1 rounded-md bg-red-600 border border-red-500 text-white text-xs font-bold tracking-wider uppercase shadow-md">
                                                Hết hàng
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Info */}
                                <div className="mt-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide line-clamp-1 group-hover:text-red-600 transition-colors" title={product.name}>
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2rem]">
                                            {product.description || 'Combo rạp chiếu phim chất lượng cao phục vụ suốt buổi chiếu.'}
                                        </p>
                                    </div>

                                    {/* Price & Quantity Controls */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Đơn giá</span>
                                            <span className="text-base sm:text-lg font-black font-mono text-red-600 tracking-tight">
                                                {Number(product.price || 0).toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        {isSoldOut ? (
                                            <span className="text-xs text-slate-400 italic">Tạm ngưng</span>
                                        ) : (
                                            <div className="flex items-center space-x-1.5">
                                                {qty === 0 ? (
                                                    <button
                                                        type="button"
                                                        disabled={isMutating || disabled}
                                                        onClick={() => handleQuantityChange(product, 1)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-600 text-slate-700 hover:text-white border border-slate-200 hover:border-red-600 text-xs font-bold transition-all duration-200 flex items-center space-x-1 shadow-xs cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isMutating ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Plus className="w-3.5 h-3.5" />
                                                                <span>Chọn</span>
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-inner">
                                                        <button
                                                            type="button"
                                                            disabled={isMutating || disabled}
                                                            onClick={() => handleQuantityChange(product, qty - 1)}
                                                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                                                            title="Giảm 1 phần"
                                                        >
                                                            {isMutating ? (
                                                                <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                                                            ) : (
                                                                <Minus className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>

                                                        <span className="w-6 text-center text-sm font-black text-slate-900 font-mono select-none">
                                                            {qty}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            disabled={isMutating || disabled || isMaxed}
                                                            onClick={() => handleQuantityChange(product, qty + 1)}
                                                            className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                                                            title={isMaxed ? 'Đã đạt giới hạn tối đa' : 'Thêm 1 phần'}
                                                        >
                                                            {isMutating ? (
                                                                <Loader2 className="w-3 h-3 animate-spin text-white" />
                                                            ) : (
                                                                <Plus className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Reminder Note */}
            <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 text-center">
                <p className="text-xs text-slate-600">
                    💡 <span className="text-slate-900 font-medium">Lưu ý:</span> Bắp nước là phần mua kèm không bắt buộc. Bạn có thể nhấn <span className="text-slate-900 font-bold">Tiếp tục</span> ở thanh bên dưới bất kỳ lúc nào để chuyển sang bước thanh toán vé.
                </p>
            </div>
        </div>
    );
};

export default ComboSelection;
