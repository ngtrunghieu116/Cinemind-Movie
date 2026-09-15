import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ShieldAlert, Home } from 'lucide-react';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-black text-red-500 tracking-widest mb-2">403</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Truy cập bị từ chối</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        Tài khoản của bạn không có quyền truy cập vào tài nguyên này.
      </p>
      <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
        Trang chủ
      </Button>
    </div>
  );
};

export default Forbidden;
