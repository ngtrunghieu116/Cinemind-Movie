import React from 'react';
import { Link } from 'react-router-dom';
import { X, Film, User, Ticket, LogOut, LogIn } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ROUTES from '../../constants/routes';

const MobileDrawer = ({ isOpen, onClose, navLinks, user, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative bg-white w-4/5 max-w-xs h-full shadow-2xl flex flex-col z-10 animate-slideRight">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Film size={18} />
            </div>
            <span className="font-black text-lg text-slate-900">
              CINE<span className="text-primary">MIND</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <Avatar name={user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email} size="md" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User Account'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={onClose}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <>
              <hr className="my-3 border-slate-100" />
              <Link
                to={ROUTES.PROFILE}
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors"
              >
                <User size={18} />
                <span>Thông tin cá nhân</span>
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          {user ? (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to={ROUTES.LOGIN}
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <LogIn size={16} />
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
