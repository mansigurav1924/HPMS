import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Heart, Bell, Menu, LogOut, ChevronDown, User } from 'lucide-react';
import { Brand } from '../config/brand';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSearchPage = location.pathname === '/search';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-brand-page flex flex-col text-gray-800 font-sans selection:bg-brand-orange selection:text-white">
      {!isSearchPage && (
        <nav className={`sticky top-0 z-[1000] transition-all duration-300 ${scrolled ? 'bg-white shadow-soft' : 'bg-brand-page'}`}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex justify-between items-center">
            <Link to="/search" className="flex items-center gap-3 group">
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src={Brand.logo} alt="Logo" className="w-10 h-10 shadow-sm rounded-xl" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-brand-navy tracking-tight text-lg">UNEED</span>
                <span className="font-semibold text-brand-orange tracking-widest text-[10px] uppercase">Hostels</span>
              </div>
            </Link>

            <div className="hidden md:flex gap-4 items-center">
              {user?.role === 'student' && (
                <Link to="/wishlist" className="btn-light-circle relative">
                  <Heart size={18} />
                </Link>
              )}
              <button className="btn-light-circle">
                <Bell size={18} />
              </button>
              
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:border-gray-300 transition-all">
                    <div className="w-8 h-8 rounded-full bg-brand-sky text-white flex items-center justify-center font-bold text-sm">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-brand-navy truncate max-w-[100px]">{user.name}</span>
                      <span className="text-[10px] text-gray-500 capitalize">{user.role}</span>
                    </div>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-float border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden">
                    <div className="p-2 flex flex-col gap-1 text-sm font-medium text-gray-700">
                      <Link to="/search" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">Find Hostels</Link>
                      {user.role === 'student' && (
                        <>
                          <Link to="/wishlist" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">My Wishlist</Link>
                          <Link to="/student/stay" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">My Stay</Link>
                          <Link to="/student/rent" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">Rent & Dues</Link>
                          <Link to="/student/bookings" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">My Bookings</Link>
                          <Link to="/complaints" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">Complaints</Link>
                          <Link to="/student/notices" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">Notices</Link>
                          <Link to="/student/reviews" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">Reviews</Link>
                          <Link to="/student/profile" className="px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">Profile</Link>
                        </>
                      )}
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button onClick={logout} className="px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-brand-navy transition-colors px-2">Log in</Link>
                  <Link to="/signup" className="btn-cta text-sm py-2 px-5">Sign up</Link>
                </div>
              )}
            </div>
            
            <button className="md:hidden btn-light-circle" onClick={() => setMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </nav>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-[2000] flex justify-end md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMenuOpen(false)}></div>
          <div className="relative w-64 bg-white h-full p-6 shadow-2xl flex flex-col gap-4 animate-slide-up">
            <button onClick={() => setMenuOpen(false)} className="self-end p-2 text-gray-500 font-bold">Close</button>
            <Link to="/search" onClick={() => setMenuOpen(false)} className="font-bold">Find Hostels</Link>
            {user ? (
              <>
                {user.role === 'student' && (
                  <>
                    <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="font-bold">Wishlist</Link>
                    <Link to="/student/stay" onClick={() => setMenuOpen(false)} className="font-bold">My Stay</Link>
                  </>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="font-bold text-red-600 text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="font-bold">Log in</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="font-bold text-brand-orange">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 w-full mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
