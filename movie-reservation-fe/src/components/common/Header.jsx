import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import MobileDrawer from '../layout/MobileDrawer';
import { Film, Search, Menu, LogOut, Ticket, Popcorn } from 'lucide-react';
import ROUTES from '../../constants/routes';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.MOVIES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { path: ROUTES.HOME, label: 'Trang chủ' },
    { path: ROUTES.MOVIES, label: 'Lịch chiếu' },
    { path: ROUTES.THEATERS, label: 'Cơ sở' },
    { path: ROUTES.TICKET_PRICES, label: 'Giá vé' },
    { path: ROUTES.ARTICLES, label: 'Tin tức' },
    { path: ROUTES.ABOUT, label: 'Giới thiệu' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg focus:outline-none"
              aria-label="Open mobile menu"
            >
              <Menu size={24} />
            </button>

            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-wider text-slate-900">
                CINE<span className="text-primary">MIND</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors ${
                  location.pathname === link.path
                    ? 'text-primary font-bold'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Input Placeholder */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm phim nhanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
          </form>

          {/* User Profile / Auth Action */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={ROUTES.PROFILE}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-full transition-all"
                >
                  <Avatar name={user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email} size="sm" />
                  <span className="hidden md:inline font-semibold text-xs text-slate-700">
                    {user.firstName || user.email?.split('@')[0]}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navLinks={navLinks}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default Header;
