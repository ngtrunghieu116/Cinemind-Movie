import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { RefreshCw, Home } from 'lucide-react';

const ServerError = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-black text-slate-700 tracking-widest mb-2">500</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Lỗi hệ thống máy chủ</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        Đã có sự cố xảy ra từ máy chủ. Chúng tôi đang khắc phục, vui lòng thử lại sau.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" icon={RefreshCw} onClick={() => window.location.reload()}>
          Tải lại trang
        </Button>
        <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
          Trang chủ
        </Button>
      </div>
    </div>
  );
};

export default ServerError;
