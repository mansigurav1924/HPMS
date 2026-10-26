import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, AlertTriangle, CheckCircle, Clock, Home, FileText, Bell,
  MessageSquare, Star, ArrowRight, Heart, Sparkles, Building2, Calendar, ShieldCheck,
  CreditCard, ChevronRight, Phone, Mail
} from 'lucide-react';
import Swal from '../../lib/swal';
import {
  PageTransition, Skeleton, Button, Card, Badge, Avatar, StatusBadge, PageHeader
} from '../../components/ui';
import { apiFetch, formatDate, formatINR } from '../../lib/api';

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/dashboard/student', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dashboard data');
        return res.json();
      })
      .then(d => {
        setData(d.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });

    // Fetch recommended hostels for discovery section
    apiFetch('/properties?page_size=3')
      .then(res => {
        const list = res?.properties || res?.items || (Array.isArray(res) ? res : []);
        setRecommended(list.slice(0, 3));
      })
      .catch(() => setRecommended([]));
  }, [token]);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl shadow-soft mt-8 border border-gray-100">
          <AlertTriangle size={48} className="mx-auto text-rose-500 mb-4" />
          <h2 className="text-2xl font-black text-brand-navy mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </PageTransition>
    );
  }

  const { hero, attention, widgets } = data || {};
  const { tenancy, booking } = hero || {};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const contactOwner = () => {
    const ownerName = booking?.owner_name || 'Property Manager';
    const ownerPhone = booking?.owner_phone || '+91 9876543210';
    Swal.fire({
      title: 'Contact Property Owner',
      html: `<div class="text-left text-sm space-y-2 mt-2">
        <p><b>Name:</b> ${ownerName}</p>
        <p><b>Phone:</b> <a href="tel:${ownerPhone}" class="text-indigo-600 font-semibold">${ownerPhone}</a></p>
        <p class="text-xs text-gray-500 mt-2">Feel free to call during standard check-in hours (9 AM - 8 PM).</p>
      </div>`,
      icon: 'info',
      confirmButtonText: 'Close'
    });
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Welcome Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-brand-navy via-[#141B42] to-primary-950 p-6 md:p-8 rounded-3xl text-white shadow-float relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-4">
            <Avatar name={user?.name} size={58} className="ring-4 ring-white/10 shadow-lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-300">Student Portal</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-0.5">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-xs md:text-sm text-gray-300 mt-1">
                {tenancy ? `Currently staying at ${tenancy.property_name}` : 'Find and manage your verified hostel accommodations.'}
              </p>
            </div>
          </div>

          {/* Quick Hostel Search inside banner */}
          <div className="relative z-10 w-full md:w-80 lg:w-96">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search hostel or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-300 focus:outline-none focus:bg-white focus:text-gray-900 focus:border-white transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 transition-colors"
                aria-label="Search"
              >
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Attention Alerts / Action Required */}
        {attention && (
          <div className="space-y-3">
            {(!attention.email_verified || !attention.phone_verified) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Account Verification Needed</h4>
                    <p className="text-xs text-amber-700">Please verify your contact details to secure your stays and notifications.</p>
                  </div>
                </div>
                <Link to="/student/profile" className="btn-secondary !py-2 !px-4 text-xs font-bold shrink-0">
                  Verify Now
                </Link>
              </div>
            )}

            {attention.profile_incomplete && (
              <div className="bg-primary-50 border border-primary-200 text-primary-950 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Complete Your Profile</h4>
                    <p className="text-xs text-primary-700">Add your College name and Emergency Contact to speed up booking approvals.</p>
                  </div>
                </div>
                <Link to="/student/profile" className="btn-cta !py-2 !px-4 text-xs font-bold shrink-0">
                  Complete Profile
                </Link>
              </div>
            )}

            {attention.complaint_to_rate && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Complaint Resolved</h4>
                    <p className="text-xs text-emerald-700">Your recent grievance was marked resolved. Please rate the solution.</p>
                  </div>
                </div>
                <Link to="/complaints" className="btn-secondary !py-2 !px-4 text-xs font-bold shrink-0">
                  Rate Resolution
                </Link>
              </div>
            )}
          </div>
        )}

        {/* State-Based Hero Section: My Stay or Active Booking */}
        <div className="rounded-3xl shadow-soft border border-gray-100 overflow-hidden bg-white">
          {!tenancy && !booking ? (
            <div className="p-8 md:p-12 text-center bg-gradient-to-b from-gray-50/50 to-white">
              <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Home size={30} />
              </div>
              <h2 className="text-2xl font-black text-brand-navy mb-2">No Active Stays or Reservations</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Explore thousands of student-friendly hostels and PGs with Wi-Fi, food, AC, and high-speed amenities.
              </p>
              <Link to="/search" className="btn-cta text-sm shadow-glow !py-3 !px-7 inline-flex items-center gap-2">
                <Search size={16} />
                <span>Find Your Room Today</span>
              </Link>
            </div>
          ) : tenancy ? (
            /* Active Tenancy Card */
            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={tenancy.status} />
                    <span className="text-xs text-gray-400 font-semibold">• Tenancy ID: {tenancy.tenancy_id?.slice(0, 8)}...</span>
                  </div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">{tenancy.property_name}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    Room {tenancy.room_number || 'TBD'} • Bed {tenancy.bed_label || 'TBD'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/student/stay" className="btn-cta text-xs font-bold !py-2.5 !px-4">
                    Manage Stay
                  </Link>
                  <Link to="/student/rent" className="btn-secondary text-xs font-bold !py-2.5 !px-4">
                    Rent & Dues
                  </Link>
                </div>
              </div>

              {/* Tenancy detail metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Check-in Date</p>
                  <p className="text-base font-extrabold text-brand-navy mt-1">
                    {tenancy.check_in_date ? formatDate(tenancy.check_in_date) : 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Digital Agreement</p>
                  <p className="text-base font-extrabold text-primary-600 mt-1 flex items-center gap-1.5">
                    <FileText size={16} />
                    <a href={tenancy.agreement_url || '#'} target="_blank" rel="noreferrer" className="hover:underline">
                      View Contract
                    </a>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-1 capitalize">
                    {tenancy.status || 'Active'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Maintenance</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">Report Issues</p>
                  </div>
                  <Link to="/complaints" className="text-primary-600 hover:text-primary-800 p-2 rounded-xl hover:bg-white">
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ) : booking ? (
            /* Active Booking Card */
            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={booking.status} />
                    <span className="text-xs text-gray-400 font-semibold">• Ref #{booking.booking_id?.slice(0, 8)}</span>
                  </div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">{booking.property_name}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    {booking.room_number ? `Room ${booking.room_number} • Bed ${booking.bed_label}` : 'Pending bed allocation'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={contactOwner} className="text-xs font-bold !py-2.5 !px-4">
                    <Phone size={14} /> Contact Owner
                  </Button>
                  <Link to="/student/bookings" className="btn-cta text-xs font-bold !py-2.5 !px-4">
                    View Booking
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Move-in Date</p>
                  <p className="text-base font-extrabold text-brand-navy mt-1">
                    {booking.move_in_date ? formatDate(booking.move_in_date) : 'TBD'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Request Date</p>
                  <p className="text-base font-extrabold text-gray-800 mt-1">
                    {booking.requested_at ? formatDate(booking.requested_at) : 'Today'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Owner Response</p>
                  <p className="text-base font-extrabold text-primary-600 mt-1">
                    {booking.status === 'requested' ? 'Within 48h' : 'Approved'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">All Bookings</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">My Requests</p>
                  </div>
                  <Link to="/student/bookings" className="text-primary-600 hover:text-primary-800 p-2 rounded-xl hover:bg-white">
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Actions Bar */}
        <div>
          <h3 className="text-base font-extrabold text-brand-navy mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-primary-600" />
            <span>Quick Services</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Find Hostels', desc: 'Map & filters', to: '/search', icon: <Search size={22} className="text-primary-600" />, bg: 'bg-primary-50' },
              { label: 'My Bookings', desc: 'Status & holds', to: '/student/bookings', icon: <Clock size={22} className="text-violet-600" />, bg: 'bg-violet-50' },
              { label: 'Saved Wishlist', desc: 'Liked properties', to: '/wishlist', icon: <Heart size={22} className="text-rose-500" />, bg: 'bg-rose-50' },
              { label: 'Complaints', desc: 'Service & repairs', to: '/complaints', icon: <MessageSquare size={22} className="text-amber-600" />, bg: 'bg-amber-50' },
            ].map((q, i) => (
              <Link
                key={i}
                to={q.to}
                className="card card-hover p-5 flex items-center gap-4 bg-white rounded-2xl border border-gray-100 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl ${q.bg} flex items-center justify-center shrink-0`}>
                  {q.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-brand-navy text-sm truncate">{q.label}</p>
                  <p className="text-xs text-gray-400 truncate">{q.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-Column Layout: Complaints, Notices, Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main 2 Cols */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recommended Hostels Discovery */}
            {recommended.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-brand-navy">Recommended Hostels</h3>
                  <Link to="/search" className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1">
                    <span>Explore map</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recommended.map((p) => (
                    <Link
                      key={p.property_id}
                      to={`/properties/${p.property_id}`}
                      className="card card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden group flex flex-col justify-between"
                    >
                      <div className="h-32 bg-gray-100 overflow-hidden relative">
                        <img
                          src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-brand-navy shadow-sm capitalize">
                          {p.type?.replace(/_/g, ' ') || 'Hostel'}
                        </span>
                      </div>
                      <div className="p-3.5">
                        <h4 className="font-bold text-sm text-brand-navy truncate group-hover:text-primary-600 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">
                          <MapPin size={12} className="text-primary-500" /> {p.city}
                        </p>
                        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-brand-navy">
                            {formatINR(p.starting_price || 6000)}/mo
                          </span>
                          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                            <Star size={12} fill="currentColor" /> {p.avg_rating ? Number(p.avg_rating).toFixed(1) : '4.8'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Complaints Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-brand-navy text-lg">My Complaints</h3>
                  {widgets?.open_complaints > 0 && (
                    <span className="badge !bg-amber-100 !text-amber-800 text-[10px]">
                      {widgets.open_complaints} Open
                    </span>
                  )}
                </div>
                <Link to="/complaints" className="text-xs font-bold text-primary-600 hover:text-primary-800">
                  View All
                </Link>
              </div>

              {(!widgets?.complaints || widgets.complaints.length === 0) ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                  No open complaints. Everything is running smoothly!
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {widgets.complaints.map((c) => (
                    <div key={c.complaint_id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{c.title || 'General Maintenance'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

          {/* Right Column: Notices & Notifications */}
          <div className="space-y-6">
            
            {/* Property Notices */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-brand-navy text-base">Hostel Notices</h3>
                <Link to="/student/notices" className="text-xs font-bold text-primary-600 hover:text-primary-800">
                  All Notices
                </Link>
              </div>

              {(!widgets?.notices || widgets.notices.length === 0) ? (
                <p className="text-xs text-gray-400 text-center py-6">No current notices for your property.</p>
              ) : (
                <div className="space-y-3">
                  {widgets.notices.map((n) => (
                    <div key={n.notice_id} className="p-3 rounded-2xl bg-gray-50 border-l-4 border-primary-500">
                      <p className="text-xs font-bold text-brand-navy line-clamp-1">{n.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.posted_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-brand-navy text-base">Recent Updates</h3>
                <Link to="/student/notifications" className="text-xs font-bold text-primary-600 hover:text-primary-800">
                  All
                </Link>
              </div>

              {(!widgets?.notifications || widgets.notifications.length === 0) ? (
                <p className="text-xs text-gray-400 text-center py-6">You're all caught up!</p>
              ) : (
                <div className="space-y-3">
                  {widgets.notifications.slice(0, 4).map((n) => (
                    <div key={n.notification_id || n.id} className="flex gap-2.5 items-start">
                      <span className={`w-2 h-2 mt-1 rounded-full shrink-0 ${n.read_at ? 'bg-gray-200' : 'bg-primary-500 ring-2 ring-primary-200'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs ${n.read_at ? 'text-gray-600 font-medium' : 'font-bold text-gray-900'} truncate`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{n.message || n.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

        </div>

      </div>
    </PageTransition>
  );
}
