import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Pencil, KeyRound, Trash2, Search, Filter, RotateCcw, X, UserCheck, Users } from 'lucide-react';
import userApi from '../api/userApi';
import Pagination from '../components/Pagination';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    role: 'USER',
    status: 'ACTIVE'
  });

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, filterRole, filterStatus, page, pageSize]);

  const fetchUsers = async () => {

    setLoading(true);
    setFetchError(false);
    try {
      const params = { page, size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;

      const res = await userApi.getUsers(params);
      setUsers(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setFetchError(true);
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || 'MALE',
      role: user.role || 'USER',
      status: user.status || 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenResetPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleCloseResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await userApi.updateUser(selectedUser.id, formData);
      toast.success('Cập nhật thông tin người dùng thành công!');
      handleCloseEditModal();
      fetchUsers();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin');
      }
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    try {
      await userApi.resetPassword(selectedUser.id, newPassword);
      toast.success('Đổi mật khẩu thành công!');
      handleCloseResetPasswordModal();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Không thể đổi mật khẩu người dùng');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await userApi.deleteUser(id);
      toast.success('Xóa người dùng thành công!');
      fetchUsers();
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Không thể xóa người dùng này');
      }
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterRole('');
    setFilterStatus('');
    setPage(0);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header Banner Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Người Dùng</h1>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider w-full mb-1">
          <Filter size={14} /> Bộ Lọc Tìm Kiếm
        </div>

        {/* Search Box */}
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>


        {/* Role Filter */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Vai trò
          </label>
          <select
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium cursor-pointer"
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(0); }}
          >
            <option value="">-- Tất cả vai trò --</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Trạng thái
          </label>
          <select
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium cursor-pointer"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="ACTIVE">HOẠT ĐỘNG</option>
            <option value="BLOCKED">ĐÃ KHÓA</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(search || filterRole || filterStatus) && (
          <button
            onClick={handleClearFilters}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Họ & Tên</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Số Điện Thoại</th>
                <th className="px-5 py-3.5">Vai Trò</th>
                <th className="px-5 py-3.5">Trạng Thái</th>
                <th className="px-5 py-3.5">Ngày Tạo</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      Đang tải danh sách người dùng...
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    <p className="text-red-500 font-medium mb-2">Không thể lấy dữ liệu người dùng</p>
                    <button
                      onClick={fetchUsers}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all font-medium text-xs cursor-pointer"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-gray-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-gray-300 stroke-1" />
                      <p className="text-sm font-medium">Không tìm thấy người dùng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-5 py-3.5 font-semibold text-gray-400 text-xs">
                      #{u.id}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">
                      {u.lastName} {u.firstName}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-medium">
                      {u.email}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-mono text-xs">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${u.status === 'BLOCKED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {u.status === 'BLOCKED' ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenResetPasswordModal(u)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          title="Đổi mật khẩu"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server-side Pagination */}
      {!loading && !fetchError && totalElements > 0 && (
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
          <Pagination
            pageNo={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
          />
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-600" />
                Cập Nhật Thông Tin Người Dùng
              </h3>
              <button onClick={handleCloseEditModal} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email (Không thể sửa)</label>
                <input
                  type="text"
                  disabled
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-medium"
                  value={selectedUser.email}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Họ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.lastName}
                    onChange={handleEditChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.firstName}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="phone"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={handleEditChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.dateOfBirth}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giới tính <span className="text-red-500">*</span></label>
                  <select
                    name="gender"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    value={formData.gender}
                    onChange={handleEditChange}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                  <select
                    name="role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    value={formData.role}
                    onChange={handleEditChange}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái <span className="text-red-500">*</span></label>
                  <select
                    name="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    value={formData.status}
                    onChange={handleEditChange}
                  >
                    <option value="ACTIVE">HOẠT ĐỘNG</option>
                    <option value="BLOCKED">ĐÃ KHÓA</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Đổi Mật Khẩu Người Dùng
              </h3>
              <button onClick={handleCloseResetPasswordModal} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-gray-600 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                Thay đổi mật khẩu trực tiếp cho tài khoản: <strong className="text-gray-900 font-bold">{selectedUser.email}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mật khẩu mới <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseResetPasswordModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Đổi Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
