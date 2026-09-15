import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { LogIn, Home } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-black text-amber-500 tracking-widest mb-2">401</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Yêu cầu đăng nhập</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        Bạn cần đăng nhập tài khoản để thực hiện chức năng này.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" icon={Home} onClick={() => navigate('/')}>
          Trang chủ
        </Button>
        <Button variant="primary" icon={LogIn} onClick={() => navigate('/login')}>
          Đăng nhập ngay
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
