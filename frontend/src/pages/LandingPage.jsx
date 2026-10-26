import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, ShieldCheck, Zap, CreditCard, Headphones, Star, ArrowRight,
  CheckCircle2, Building2, Users, BedDouble, Wifi, Utensils, Sparkles, ChevronRight
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import { Button, Card, Badge } from '../components/ui';
import { apiFetch, formatINR } from '../lib/api';
import { useAuth } from '../AuthContext';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [genderType, setGenderType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    // Fetch real properties from /properties
    apiFetch('/properties?page_size=6')
      .then(res => {
        const list = res?.properties || res?.items || (Array.isArray(res) ? res : []);
        setFeatured(list.slice(0, 6));
      })
      .catch(() => {
        setFeatured([]);
      })
      .finally(() => setLoadingProps(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (genderType) params.set('gender_type', genderType);
    if (maxPrice) params.set('max_price', maxPrice);
    navigate(`/search?${params.toString()}`);
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'owner' ? '/owner' : '/student/dashboard';

  return (
    <div className="min-h-screen bg-[#F5F6FF] text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo to="/" />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <Link to="/search" className="hover:text-primary-600 transition-colors">Explore Stays</Link>
            <a href="#features" className="hover:text-primary-600 transition-colors">Why HPMS</a>
            <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#owners" className="hover:text-primary-600 transition-colors">For Owners</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={dashboardPath} className="btn-cta text-sm !py-2.5 !px-5 flex items-center gap-2">
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-primary-600 px-3 py-2 transition-colors">
                  Log in
                </Link>
                <Link to="/signup" className="btn-cta text-sm !py-2.5 !px-5 shadow-glow">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-primary-400/20 via-violet-400/20 to-sky-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-soft border border-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Sparkles size={14} className="text-primary-500" />
              <span>Next-Gen Accommodation Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy tracking-tight leading-[1.12]"
            >
              Find Your <span className="bg-gradient-to-r from-primary-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">Perfect Stay</span> with HPMS
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto"
            >
              Discover comfortable, affordable, verified hostels and PGs with transparent pricing, instant booking, and hassle-free living.
            </motion.p>
          </div>

          {/* Interactive Search Bar Box */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-float border border-white/60">
              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">
                {/* City */}
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 ml-3">
                    City / Location
                  </label>
                  <div className="relative flex items-center">
                    <MapPin size={18} className="absolute left-3 text-primary-500" />
                    <input
                      type="text"
                      placeholder="e.g. Kota, Delhi, Pune"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
                    />
                  </div>
                </div>

                {/* Property / Gender Type */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 ml-3">
                    Property Type
                  </label>
                  <select
                    value={genderType}
                    onChange={(e) => setGenderType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all cursor-pointer"
                  >
                    <option value="">All Stays</option>
                    <option value="boys_hostel">Boys Hostel</option>
                    <option value="girls_hostel">Girls Hostel</option>
                    <option value="coed">Co-ed Living</option>
                  </select>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 ml-3">
                    Budget (Up to)
                  </label>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all cursor-pointer"
                  >
                    <option value="">Any Budget</option>
                    <option value="6000">₹6,000 / mo</option>
                    <option value="10000">₹10,000 / mo</option>
                    <option value="15000">₹15,000 / mo</option>
                    <option value="25000">₹25,000 / mo</option>
                  </select>
                </div>

                {/* Search Button */}
                <div className="sm:col-span-3 lg:col-span-1 pt-2 sm:pt-0">
                  <Button type="submit" className="w-full !py-3.5 !rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-glow">
                    <Search size={18} />
                    <span>Search Stay</span>
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { val: '100%', label: 'Verified Properties', icon: <ShieldCheck className="text-emerald-500" size={20} /> },
              { val: 'Zero', label: 'Brokerage Fee', icon: <CreditCard className="text-primary-500" size={20} /> },
              { val: '24/7', label: 'Dedicated Support', icon: <Headphones className="text-violet-500" size={20} /> },
              { val: 'Instant', label: 'Hold & Confirmation', icon: <Zap className="text-amber-500" size={20} /> },
            ].map((stat, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-soft text-center flex items-center gap-3 justify-center">
                <span className="p-2.5 rounded-xl bg-gray-50">{stat.icon}</span>
                <div className="text-left">
                  <p className="text-base font-extrabold text-brand-navy leading-tight">{stat.val}</p>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 md:py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-primary-600 uppercase">Top Choices</span>
              <h2 className="text-3xl font-extrabold text-brand-navy tracking-tight mt-1">
                Featured Hostels & PGs
              </h2>
              <p className="text-gray-500 text-sm mt-1">High-rated properties vetted by our verification team.</p>
            </div>
            <Link to="/search" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors">
              <span>View all properties</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {loadingProps ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50 border-dashed border-2">
              <Building2 size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="font-bold text-brand-navy text-lg">Properties are being updated</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Explore our full search map to see stays in your area right now.
              </p>
              <Link to="/search" className="btn-cta text-sm mt-4">
                Explore Stays Map
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <motion.div
                  key={p.property_id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="card group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-float border border-gray-100"
                >
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img
                      src={p.cover_photo || DEFAULT_COVER}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur text-brand-navy shadow-sm capitalize">
                        {p.type?.replace(/_/g, ' ') || 'Hostel'}
                      </span>
                      {p.status === 'Approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      )}
                    </div>
                    {p.starting_price && (
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-2xl bg-brand-navy/90 backdrop-blur text-white text-xs font-bold shadow-md">
                        {formatINR(p.starting_price)} <span className="font-normal text-gray-300">/mo</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-lg text-brand-navy truncate group-hover:text-primary-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1.5 truncate">
                        <MapPin size={13} className="text-primary-500 shrink-0" />
                        <span>{[p.address, p.city].filter(Boolean).join(', ')}</span>
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star size={16} fill="currentColor" />
                        <span>{p.avg_rating ? Number(p.avg_rating).toFixed(1) : '4.8'}</span>
                        <span className="text-gray-400 font-normal text-xs">(Reviews)</span>
                      </div>
                      <Link to={`/properties/${p.property_id}`} className="btn-secondary !py-1.5 !px-3.5 text-xs font-bold">
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="py-20 md:py-28 bg-[#F5F6FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-primary-600 uppercase">Built for Peace of Mind</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight mt-1">
              Why Students & Owners Love HPMS
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-2">
              Everything you need to search, book, and live peacefully in one seamless platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck size={28} className="text-primary-600" />,
                title: 'Strict Property Verification',
                desc: 'Every hostel is physically vetted and owner KYC certified by our compliance team before going live.',
              },
              {
                icon: <Zap size={28} className="text-violet-600" />,
                title: 'Instant Booking & Check-in',
                desc: 'Select your preferred room and bed, confirm in seconds, and track check-in status in real time.',
              },
              {
                icon: <CreditCard size={28} className="text-indigo-600" />,
                title: 'Clear Rent & Deposit Ledgers',
                desc: 'Complete transparency with digital tenancy contracts, rent due schedules, and zero hidden charges.',
              },
              {
                icon: <Headphones size={28} className="text-emerald-600" />,
                title: 'Fast Complaint Resolution',
                desc: 'Raise maintenance requests or grievances directly with SLA tracking and escalation workflows.',
              },
              {
                icon: <Wifi size={28} className="text-sky-600" />,
                title: 'Verified Amenities & Photos',
                desc: 'Real high-resolution photographs, verified Wi-Fi, food menus, AC status, and room configurations.',
              },
              {
                icon: <Building2 size={28} className="text-rose-600" />,
                title: 'SaaS Property Dashboard',
                desc: 'Dedicated owner portals to manage beds, tenant notices, reviews, and bookings with zero paperwork.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="bg-white p-7 rounded-3xl border border-gray-100 shadow-soft hover:shadow-float transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="font-extrabold text-lg text-brand-navy mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section id="how-it-works" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-primary-600 uppercase">Simple 3-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight mt-1">
              How HPMS Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { step: '01', title: 'Discover & Compare', desc: 'Search verified hostels around your college or office. Filter by budget, sharing, and facilities.' },
              { step: '02', title: 'Request or Book Instantly', desc: 'Reserve your bed directly with zero broker interference. Keep tabs on approvals and move-in schedules.' },
              { step: '03', title: 'Live & Manage Effortlessly', desc: 'Track your stay, access digital agreements, report complaints, and monitor dues from your personalized dashboard.' },
            ].map((s, i) => (
              <div key={i} className="relative bg-gray-50/70 p-8 rounded-3xl border border-gray-100">
                <span className="text-4xl font-black bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent mb-4 block">
                  {s.step}
                </span>
                <h3 className="font-extrabold text-xl text-brand-navy mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner CTA Banner */}
      <section id="owners" className="py-16 md:py-24 bg-gradient-to-br from-brand-navy via-[#141B42] to-primary-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:32px_32px]" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-primary-200 border border-white/15 uppercase tracking-wider">
              For Property Owners & Wardens
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-4 text-white">
              Maximize Your Occupancy with Zero Headaches
            </h2>
            <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
              List your PG or hostel, receive genuine booking requests from students, manage bed allocations, and track rent digitally.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/signup" className="btn-cta text-sm !py-3.5 !px-7 font-bold shadow-glow text-center">
              List Your Property
            </Link>
            <Link to="/login" className="px-6 py-3.5 rounded-full text-sm font-bold bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-center">
              Owner Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Logo to="/" />
            <span className="text-gray-300 hidden sm:inline">|</span>
            <p className="text-xs text-gray-400">© 2026 HPMS Portal. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-gray-600">
            <Link to="/search" className="hover:text-primary-600 transition-colors">Find Hostels</Link>
            <Link to="/login" className="hover:text-primary-600 transition-colors">Student Login</Link>
            <Link to="/login" className="hover:text-primary-600 transition-colors">Owner Portal</Link>
            <Link to="/signup" className="hover:text-primary-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
