import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Tags,
    Film,
    Building2,
    Users,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    Calendar,
    Coffee,
    Ticket,
    FileText,
    MessageSquare
} from 'lucide-react';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/bookings', icon: <Ticket size={20} />, label: 'Quản Lý Đặt Vé' },
        { path: '/genres', icon: <Tags size={20} />, label: 'Thể Loại' },
        { path: '/movies', icon: <Film size={20} />, label: 'Phim Chiếu' },
        { path: '/theaters', icon: <Building2 size={20} />, label: 'Cơ Sở Rạp' },
        { path: '/showtimes', icon: <Calendar size={20} />, label: 'Lịch Chiếu' },
        { path: '/products', icon: <Coffee size={20} />, label: 'Bắp & Nước F&B' },
        { path: '/articles', icon: <FileText size={20} />, label: 'Tin Tức & Bài Viết' },
        { path: '/reviews', icon: <MessageSquare size={20} />, label: 'Đánh Giá & Nhận Xét' },
        { path: '/users', icon: <Users size={20} />, label: 'Người Dùng' },
    ];

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className={`bg-white w-64 shadow-lg flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full fixed z-20 h-full'}`}>
                {/* Logo Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-slate-900 text-white">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
                            <Film className="w-5.5 h-5.5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-wider text-white-900">
                            CINE<span className="text-red-600">MIND</span>
                        </span>
                    </Link>
                    {!sidebarOpen && (
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    )}
                </div>
                {/* Logo */}


                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${isActive
                                    ? 'bg-red-50 text-red-600 border border-red-200/80 shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span className={isActive ? 'text-red-600' : 'text-slate-400'}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 bg-white shadow-xs border-b border-slate-200 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-slate-500 hover:text-slate-800 focus:outline-none p-1.5 rounded-lg hover:bg-slate-100 transition"
                        >
                            <Menu size={22} />
                        </button>

                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-slate-800">{user.firstName || 'Quản lý'} {user.lastName || ''}</span>
                                <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">ADMIN</span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-red-600/30">
                                {user.firstName?.charAt(0) || 'A'}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="ml-1 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Đăng xuất"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Scrollable View */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
