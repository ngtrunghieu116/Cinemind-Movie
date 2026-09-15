import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { reservationApi } from '../api/reservationApi';
import { User, Lock, CheckCircle, AlertCircle, Shield, Ticket, X, Save, RefreshCw, ChevronRight } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State (Mặc định 'info')
  const activeTab = searchParams.get('tab') === 'bookings' ? 'bookings' : 'info';

  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'OTHER',
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Booking History State (cho Tab Lịch sử giao dịch)
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);

  // Synchronize Auth User data to form
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || 'OTHER',
      });
    }
  }, [user]);

  // Fetch Booking History when switching to 'bookings' tab
  const fetchBookingHistory = useCallback(async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const data = await reservationApi.getMyBookingHistory();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch booking history:', err);
      setBookingsError(err?.message || 'Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.');
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookingHistory();
    }
  }, [activeTab, fetchBookingHistory]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setLoadingProfile(true);

    try {
      const updatedUser = await authApi.updateProfile(profileData);
      setUser(updatedUser);
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      const errorMsg = err.message || Object.values(err)[0] || 'Cập nhật thất bại!';
      setProfileMsg({ type: 'error', text: errorMsg });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Xác nhận mật khẩu không khớp!' });
      return;
    }

    setLoadingPassword(true);
    try {
      const message = await authApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      setPasswordMsg({ type: 'success', text: message || 'Đổi mật khẩu thành công!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg({ type: '', text: '' });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }, 1500);
    } catch (err) {
      const errorMsg = err.message || Object.values(err)[0] || 'Đổi mật khẩu thất bại!';
      setPasswordMsg({ type: 'error', text: errorMsg });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleRowClick = (orderId) => {
    if (!orderId) return;
    navigate(`/payment/status?orderId=${encodeURIComponent(orderId)}`);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '----';
    const dateObj = new Date(isoString);
    const time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} ${date}`;
  };

  return (
    <div className="flex-grow py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-6 font-sans">
      {/* Page Title & Navigation Tabs */}
      <div className="w-full text-center space-y-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Tài Khoản Cá Nhân</h1>

        {/* Tab Switcher Bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'info' })}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-xs'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'bookings' })}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-xs'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Lịch sử giao dịch</span>
          </button>
        </div>
      </div>

      {/* TAB 1: THÔNG TIN CÁ NHÂN */}
      {activeTab === 'info' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl flex flex-col gap-6 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-4">
            <User className="w-6 h-6" />
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900">Chi tiết tài khoản</h2>
            {user?.role === 'ADMIN' && (
              <span className="ml-auto px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200 flex items-center gap-1 font-bold">
                <Shield className="w-3.5 h-3.5" /> Admin
              </span>
            )}
          </div>

          {profileMsg.text && (
            <div
              className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {profileMsg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Họ *</label>
              <input
                type="text"
                required
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-medium outline-none"
                placeholder="Nhập họ"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tên *</label>
              <input
                type="text"
                required
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-medium outline-none"
                placeholder="Nhập tên"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Số điện thoại *</label>
              <input
                type="tel"
                required
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-medium outline-none"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email (Không thể thay đổi)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-sm font-medium outline-none cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ngày sinh *</label>
              <input
                type="date"
                required
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-medium outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Giới tính</label>
              <select
                value={profileData.gender}
                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-medium outline-none"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end items-center gap-3 pt-6 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" /> Đổi mật khẩu
              </button>
              <button
                type="submit"
                disabled={loadingProfile}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2 min-w-[140px] justify-center cursor-pointer"
              >
                {loadingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Lưu thông tin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ GIAO DỊCH (LIGHT MODE TABLE) */}
      {activeTab === 'bookings' && (
        <div className="w-full">
          {/* Loading Skeleton */}
          {loadingBookings && (
            <div className="max-w-5xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                <div className="h-14 bg-slate-50 rounded-xl w-full"></div>
                <div className="h-14 bg-slate-50 rounded-xl w-full"></div>
                <div className="h-14 bg-slate-50 rounded-xl w-full"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loadingBookings && bookingsError && (
            <div className="max-w-xl mx-auto my-8 bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Đã Xảy Ra Lỗi</h3>
              <p className="text-xs text-slate-500">{bookingsError}</p>
              <button
                type="button"
                onClick={fetchBookingHistory}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center space-x-2 mx-auto cursor-pointer shadow-md shadow-red-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải Lại Trang</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingBookings && !bookingsError && bookings.length === 0 && (
            <EmptyState
              title="Bạn chưa có lịch sử giao dịch nào"
              description="Hãy lựa chọn các suất chiếu mới nhất và thưởng thức phim tại Cinemind."
              icon={Ticket}
              actionText="Khám Phá Phim Đang Chiếu"
              onAction={() => navigate('/movies')}
            />
          )}

          {/* Booking History Table (Light Mode) */}
          {!loadingBookings && !bookingsError && bookings.length > 0 && (
            <div className="max-w-5xl mx-auto bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[650px] text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-5 w-[22%]">Ngày giao dịch</th>
                      <th className="py-4 px-5 w-[34%]">Tên phim</th>
                      <th className="py-4 px-5 w-[18%]">Loại giao dịch</th>
                      <th className="py-4 px-5 w-[10%] text-center">Số vé</th>
                      <th className="py-4 px-5 w-[16%] text-right">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium">
                    {bookings.map((item) => (
                      <tr
                        key={item.reservationId || item.orderId}
                        onClick={() => handleRowClick(item.orderId)}
                        className="group hover:bg-slate-50/90 cursor-pointer transition-colors duration-150 text-slate-700"
                      >
                        {/* Ngày giao dịch */}
                        <td className="py-4 px-5 whitespace-nowrap font-mono text-slate-500 truncate">
                          {formatDateTime(item.transactionDate)}
                        </td>

                        {/* Tên phim */}
                        <td className="py-4 px-5 font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                          <span className="truncate block" title={item.movieTitle}>
                            {item.movieTitle || 'Vé Phim Cinemind'}
                          </span>
                        </td>

                        {/* Loại giao dịch */}
                        <td className="py-4 px-5 whitespace-nowrap text-slate-500 truncate">
                          {item.transactionType || 'Mua online'}
                        </td>

                        {/* Số vé */}
                        <td className="py-4 px-5 whitespace-nowrap text-center font-bold text-slate-900">
                          {item.ticketCount || 0}
                        </td>

                        {/* Số tiền */}
                        <td className="py-4 px-5 whitespace-nowrap text-right font-black font-mono text-red-600 text-base">
                          <div className="flex items-center justify-end space-x-1.5">
                            <span>{formatCurrency(item.totalAmount)}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Change Password Modal (Light Mode) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all text-slate-900">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" /> Đổi mật khẩu
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordMsg({ type: '', text: '' });
                }}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {passwordMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                    passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {passwordMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="font-medium">{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none"
                    placeholder="Nhập mật khẩu cũ"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center min-w-[120px]"
                  >
                    {loadingPassword ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Cập nhật'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
