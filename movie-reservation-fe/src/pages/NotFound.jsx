import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-black text-red-600 tracking-widest mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Không tìm thấy trang</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        Trang bạn đang truy cập không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
        <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
          Trang chủ
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
