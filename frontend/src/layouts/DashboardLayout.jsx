import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, FileText, LogOut, Menu, X, AlertCircle, FileCheck2, Hotel,
  Bell, Star, BarChart3, ShieldCheck, ClipboardList, Copy, ScrollText, KeyRound, UserCheck,
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import NotificationBell from '../components/layout/NotificationBell';
import { Avatar } from '../components/ui';

const ICON = 18;

const OWNER_LINKS = [
  { section: 'Overview' },
  { path: '/owner', label: 'Dashboard', icon: <LayoutDashboard size={ICON} />, end: true },
  { path: '/owner/properties', label: 'Properties', icon: <Building2 size={ICON} /> },
  { section: 'Operations' },
  { path: '/owner/bookings', label: 'Bookings', icon: <FileCheck2 size={ICON} /> },
  { path: '/owner/tenants', label: 'Tenants', icon: <Users size={ICON} /> },
  { path: '/owner/rent', label: 'Rent & Ledger', icon: <FileText size={ICON} /> },
  { path: '/owner/complaints', label: 'Complaints', icon: <AlertCircle size={ICON} /> },
  { section: 'Engage' },
  { path: '/owner/notices', label: 'Notices', icon: <Bell size={ICON} /> },
  { path: '/owner/reviews', label: 'Reviews', icon: <Star size={ICON} /> },
  { path: '/owner/reports', label: 'Reports', icon: <BarChart3 size={ICON} /> },
  { section: 'Account' },
  { path: '/owner/kyc', label: 'KYC Status', icon: <ShieldCheck size={ICON} /> },
];

const ADMIN_LINKS = [
  { section: 'Overview' },
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={ICON} />, end: true },
  { section: 'Verification' },
  { path: '/admin/owners', label: 'Owner Verification', icon: <UserCheck size={ICON} /> },
  { path: '/admin/properties', label: 'Properties', icon: <Building2 size={ICON} /> },
  { path: '/admin/duplicates', label: 'Duplicate Flags', icon: <Copy size={ICON} /> },
  { section: 'Management' },
  { path: '/admin/users', label: 'Users', icon: <Users size={ICON} /> },
  { path: '/admin/escalated', label: 'Escalated Issues', icon: <AlertCircle size={ICON} /> },
  { path: '/admin/reviews', label: 'Reviews', icon: <Star size={ICON} /> },
  { path: '/admin/colleges', label: 'Colleges', icon: <Hotel size={ICON} /> },
  { section: 'System' },
  { path: '/admin/reports', label: 'Reports', icon: <ClipboardList size={ICON} /> },
  { path: '/admin/audit', label: 'Audit Log', icon: <ScrollText size={ICON} /> },
  { path: '/admin/notifications', label: 'Notification Logs', icon: <Bell size={ICON} /> },
  { path: '/admin/data-access', label: 'Data Access', icon: <KeyRound size={ICON} /> },
];

function SidebarContent({ links, onNavigate, onLogout }) {
  return (
    <>
      <div className="p-6 pb-4">
        <Logo to="/" tone="light" />
      </div>

      <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5" aria-label="Primary">
        {links.map((link, i) =>
          link.section ? (
            <p key={'s' + i} className="px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
              {link.section}
            </p>
          ) : (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600/90 to-violet-600/80 shadow-glow"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{link.icon}</span>
                  <span className="relative z-10">{link.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-all font-medium"
        >
          <LogOut size={ICON} />
          Logout
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? ADMIN_LINKS : OWNER_LINKS;

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-dash-bg font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-gradient-to-b from-dash-purple to-[#111B45] text-white">
        <SidebarContent links={links} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 w-72 flex flex-col bg-gradient-to-b from-dash-purple to-[#111B45] text-white shadow-2xl"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-5 right-4 text-white/60 hover:text-white"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
              <SidebarContent links={links} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden btn-light-circle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">Welcome back,</p>
              <p className="text-sm font-bold text-brand-navy leading-tight">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <Avatar name={user?.name} size={36} />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-gray-800 max-w-[140px] truncate">{user?.name}</span>
                <span className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
