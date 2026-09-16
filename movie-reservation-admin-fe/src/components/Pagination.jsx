import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    pageNo: propPageNo,
    currentPage,
    pageSize = 10,
    totalElements = 0,
    totalPages = 1,
    onPageChange,
    onPageSizeChange
}) => {
    const pageNo = propPageNo ?? currentPage ?? 0;
    if (totalElements === 0) return null;

    const startElement = Math.max(1, pageNo * pageSize + 1);
    const endElement = Math.min((pageNo + 1) * pageSize, totalElements);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(0, pageNo - 2);
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 w-full">
            {/* Info Summary */}
            <div className="flex items-center gap-4">
                <span>
                    Hiển thị <strong className="font-semibold text-gray-900">{startElement}</strong> - <strong className="font-semibold text-gray-900">{endElement}</strong> trong tổng số <strong className="font-semibold text-gray-900">{totalElements}</strong> bản ghi
                </span>

                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-xs text-gray-500">Hiển thị:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none cursor-pointer"
                        >
                            <option value={5}>5 / trang</option>
                            <option value={10}>10 / trang</option>
                            <option value={20}>20 / trang</option>
                            <option value={50}>50 / trang</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(pageNo - 1)}
                    disabled={pageNo === 0}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Trang trước"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Number Buttons */}
                {getPageNumbers().map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            p === pageNo
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {p + 1}
                    </button>
                ))}

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(pageNo + 1)}
                    disabled={pageNo >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Trang tiếp"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
