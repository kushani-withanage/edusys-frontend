import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, LayoutDashboard, Shield } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-xl">
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide leading-none">iCET EduSys</h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Admin Portal</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-indigo-600/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold truncate">{user?.fullName || 'Administrator'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@edusys.com'}</p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-end shadow-sm">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                Role: {user?.role || 'ADMIN'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
