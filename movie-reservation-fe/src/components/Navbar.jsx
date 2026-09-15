import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-xl font-black tracking-wider text-slate-900">
              CINE<span className="text-red-600">MIND</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            <Link to="/" className="text-slate-700 hover:text-red-600 transition">Trang chủ</Link>
            <Link to="/movies" className="text-slate-700 hover:text-red-600 transition">Phim đang chiếu</Link>
            <Link to="/cinemas" className="text-slate-700 hover:text-red-600 transition">Rạp chiếu</Link>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {user.role === 'ADMIN' && (
                  <span className="px-3 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-200 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </span>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-sm text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 px-3.5 py-2 rounded-xl border border-slate-200 transition font-medium"
                >
                  <User className="w-4 h-4 text-red-600" />
                  <span>{user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm text-slate-700 hover:text-red-600 px-3 py-2 rounded-xl transition font-semibold"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 transition duration-200"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
