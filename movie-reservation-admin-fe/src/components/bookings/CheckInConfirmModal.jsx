import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const CheckInConfirmModal = ({ isOpen, ticket, onConfirm, onClose, loading }) => {
    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <AlertCircle size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                            Xác Nhận Check-In Vé
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-sm border border-slate-200/70">
                    <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Mã vé:</span>
                        <span className="font-mono font-bold text-slate-800">{ticket.ticketCode}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Ghế ngồi:</span>
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            {ticket.seatName}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Giá vé:</span>
                        <span className="font-semibold text-slate-800">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticket.price || 0)}
                        </span>
                    </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                    Bạn có chắc chắn muốn thực hiện check-in cho vé này? Hành động này sẽ đánh dấu vé đã được sử dụng tại cửa rạp.
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(ticket.ticketCode)}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Xác Nhận Check-In
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckInConfirmModal;
