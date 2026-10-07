import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FileText, Settings, LogOut, Menu, Bell, Search, AlertCircle, FileCheck2, Hotel } from 'lucide-react';
import { Brand } from '../config/brand';

const OWNER_LINKS = [
  { path: '/owner', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/owner/properties', label: 'Properties', icon: <Building2 size={20} /> },
  { path: '/owner/bookings', label: 'Bookings', icon: <FileCheck2 size={20} /> },
  { path: '/owner/tenants', label: 'Tenants', icon: <Users size={20} /> },
  { path: '/owner/rent', label: 'Rent & Ledger', icon: <FileText size={20} /> },
  { path: '/owner/complaints', label: 'Complaints', icon: <AlertCircle size={20} /> },
  { path: '/owner/notices', label: 'Notices', icon: <Bell size={20} /> },
  { path: '/owner/kyc', label: 'KYC Status', icon: <ShieldCheck size={20} /> },
];

const ADMIN_LINKS = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/admin/owners', label: 'Verification Queue', icon: <ShieldCheck size={20} /> },
  { path: '/admin/escalated', label: 'Escalated Issues', icon: <AlertCircle size={20} /> },
  { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
  { path: '/admin/properties', label: 'Properties', icon: <Building2 size={20} /> },
  { path: '/admin/colleges', label: 'Colleges', icon: <Hotel size={20} /> },
];

import { ShieldCheck } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const links = user?.role === 'admin' ? ADMIN_LINKS : OWNER_LINKS;

  return (
    <div className="flex h-screen bg-dash-bg font-sans selection:bg-dash-sky selection:text-white">
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-dash-purple text-white shadow-xl z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src={Brand.logo} alt="Logo" className="w-8 h-8 shadow-sm rounded-lg" />
          </div>
          <span className="font-bold tracking-wider text-lg">PORTAL</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {links.map((link) => {
            const active = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active ? 'bg-white/10 text-dash-sky font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white font-medium'
                }`}>
                {link.icon}
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all font-medium">
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-dash-sky transition-all">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none focus:outline-none text-sm w-48" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-dash-purple transition-colors relative">
              <Bell size={20} />
              <span className="absolute 0 top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
              <div className="w-8 h-8 rounded-full bg-dash-sky text-white flex items-center justify-center font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-gray-800">{user?.name}</span>
                <span className="text-[10px] text-gray-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
