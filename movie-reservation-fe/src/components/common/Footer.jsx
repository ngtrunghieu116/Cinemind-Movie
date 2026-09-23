import React from 'react';
import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import ROUTES from '../../constants/routes';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">
                <Film size={18} />
              </div>
              <span className="text-lg font-black text-white tracking-wider">
                CINE<span className="text-primary">MIND</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hệ thống đặt vé phim trực tuyến hiện đại, mang lại trải nghiệm điện ảnh chân thực và tiện lợi nhất.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Điều hướng</h4>
            <ul className="space-y-2">
              <li><Link to={ROUTES.HOME} className="hover:text-white transition-colors">Trang chủ</Link></li>
              <li><Link to={ROUTES.MOVIES} className="hover:text-white transition-colors">Phim chiếu</Link></li>
              <li><Link to={ROUTES.TICKET_PRICES} className="hover:text-white transition-colors">Giá vé</Link></li>
              <li><Link to={ROUTES.ABOUT} className="hover:text-white transition-colors">Giới thiệu</Link></li>
              <li><Link to={ROUTES.FOOD_PREVIEW} className="hover:text-white transition-colors">Bắp & Nước F&B</Link></li>
              <li><Link to={ROUTES.POLICY} className="hover:text-white transition-colors">Chính sách & Điều khoản</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Tài khoản</h4>
            <ul className="space-y-2">
              <li><Link to={ROUTES.LOGIN} className="hover:text-white transition-colors">Đăng nhập</Link></li>
              <li><Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">Đăng ký tài khoản</Link></li>
              <li><Link to={ROUTES.PROFILE} className="hover:text-white transition-colors">Thông tin cá nhân</Link></li>
              <li><Link to="/profile?tab=bookings" className="hover:text-white transition-colors">Lịch sử giao dịch</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Liên hệ</h4>
            <p className="mb-1">Hotline: 1900 6000</p>
            <p className="mb-1">Email: support@cinemind.vn</p>
            <p>Thời gian làm việc: 8:00 - 22:00</p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500">
          <p>© 2026 <span className="text-primary font-bold">CineMind</span>. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to={`${ROUTES.POLICY}?tab=privacy`} className="hover:text-slate-300 transition-colors">
              Bảo mật
            </Link>
            <Link to={`${ROUTES.POLICY}?tab=terms`} className="hover:text-slate-300 transition-colors">
              Điều khoản
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
