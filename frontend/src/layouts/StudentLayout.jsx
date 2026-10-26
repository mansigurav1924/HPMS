import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart, Menu, LogOut, ChevronDown, X, LayoutDashboard, Search, FileCheck2, Home, FileText,
  AlertCircle, Bell, Star, User,
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import NotificationBell from '../components/layout/NotificationBell';
import { Avatar, Popover } from '../components/ui';

const I = 18;
const STUDENT_LINKS = [
  { path: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={I} /> },
  { path: '/search', label: 'Find Hostels', icon: <Search size={I} /> },
  { path: '/wishlist', label: 'Wishlist', icon: <Heart size={I} /> },
  { path: '/student/bookings', label: 'My Bookings', icon: <FileCheck2 size={I} /> },
  { path: '/student/stay', label: 'My Stay', icon: <Home size={I} /> },
  { path: '/student/rent', label: 'Rent & Dues', icon: <FileText size={I} /> },
  { path: '/complaints', label: 'Complaints', icon: <AlertCircle size={I} /> },
  { path: '/student/notices', label: 'Notices', icon: <Bell size={I} /> },
  { path: '/student/reviews', label: 'Reviews', icon: <Star size={I} /> },
  { path: '/student/profile', label: 'Profile', icon: <User size={I} /> },
];

const STUDENT_AREA = [/^\/student\//, /^\/wishlist/, /^\/complaints/];

function SideLinks({ onNavigate }) {
  return (
    <nav className="space-y-1" aria-label="Student navigation">
      {STUDENT_LINKS.map((l) => (
        <NavLink
          key={l.path}
          to={l.path}
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
                  layoutId="student-sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600/90 to-violet-600/80 shadow-glow"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative z-10">{l.icon}</span>
              <span className="relative z-10">{l.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const isSearchPage = location.pathname === '/search';
  const isStudent = user?.role === 'student';
  const showSidebar = isStudent && STUDENT_AREA.some((r) => r.test(location.pathname));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'owner' ? '/owner' : '/student/dashboard';

  return (
    <div className="min-h-screen bg-brand-page flex flex-col text-gray-800 font-sans">
      {!isSearchPage && (
        <nav
          className={`sticky top-0 z-[1000] transition-all duration-300 ${
            scrolled ? 'bg-white/85 backdrop-blur-xl shadow-soft' : 'bg-brand-page/90 backdrop-blur'
          }`}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[72px] flex justify-between items-center">
            <Logo to="/" />

            <div className="hidden md:flex gap-3 items-center">
              <Link to="/search" className="text-sm font-semibold text-gray-600 hover:text-primary-700 transition-colors px-3">
                Find Hostels
              </Link>
              {isStudent && (
                <Link to="/wishlist" className="btn-light-circle" aria-label="Wishlist">
                  <Heart size={18} />
                </Link>
              )}
              {user && <NotificationBell />}

              {user ? (
                <Popover
                  align="right"
                  isOpen={userMenu}
                  onClose={() => setUserMenu(false)}
                  trigger={
                    <button
                      onClick={() => setUserMenu((o) => !o)}
                      aria-expanded={userMenu}
                      aria-haspopup="menu"
                      className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:border-primary-200 transition-all"
                    >
                      <Avatar name={user.name} size={32} />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-brand-navy truncate max-w-[100px]">{user.name}</span>
                        <span className="text-[10px] text-primary-600 font-semibold capitalize">{user.role}</span>
                      </div>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
                    </button>
                  }
                >
                  <div className="p-2 flex flex-col gap-0.5 text-sm font-medium text-gray-700 w-56">
                    <Link to={dashboardPath} className="px-4 py-2 hover:bg-primary-50 rounded-xl transition-colors">Dashboard</Link>
                    {isStudent && (
                      <>
                        <Link to="/student/bookings" className="px-4 py-2 hover:bg-primary-50 rounded-xl transition-colors">My Bookings</Link>
                        <Link to="/student/stay" className="px-4 py-2 hover:bg-primary-50 rounded-xl transition-colors">My Stay</Link>
                        <Link to="/student/profile" className="px-4 py-2 hover:bg-primary-50 rounded-xl transition-colors">Profile</Link>
                      </>
                    )}
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleLogout} className="px-4 py-2 text-left text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </Popover>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-brand-navy transition-colors px-2">Log in</Link>
                  <Link to="/signup" className="btn-cta text-sm !py-2 !px-5">Sign up</Link>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {user && <NotificationBell />}
              <button className="btn-light-circle" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[2000] flex justify-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-72 h-full p-5 shadow-2xl flex flex-col gap-2 bg-gradient-to-b from-dash-purple to-[#111B45] text-white overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <Logo to="/" tone="light" subtitle={false} />
                <button onClick={() => setMenuOpen(false)} className="p-2 text-white/60 hover:text-white" aria-label="Close menu">
                  <X size={22} />
                </button>
              </div>
              {isStudent ? (
                <SideLinks onNavigate={() => setMenuOpen(false)} />
              ) : (
                <>
                  <Link to="/search" className="px-4 py-2.5 rounded-xl text-white/80 hover:bg-white/5">Find Hostels</Link>
                  {user && <Link to={dashboardPath} className="px-4 py-2.5 rounded-xl text-white/80 hover:bg-white/5">Dashboard</Link>}
                </>
              )}
              <div className="mt-auto pt-4 border-t border-white/10">
                {user ? (
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 font-medium">
                    <LogOut size={18} /> Logout
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" className="btn-secondary">Log in</Link>
                    <Link to="/signup" className="btn-cta">Sign up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full flex">
        {showSidebar && (
          <aside className="hidden lg:flex flex-col w-64 shrink-0 p-4 pr-0">
            <div className="sticky top-[88px] rounded-3xl bg-gradient-to-b from-dash-purple to-[#111B45] p-3 shadow-float">
              <SideLinks />
            </div>
          </aside>
        )}
        <div className="flex-1 min-w-0 mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
