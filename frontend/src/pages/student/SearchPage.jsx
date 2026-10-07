import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import GoogleMapsProvider from '../../components/maps/GoogleMapsProvider';
import MapView from '../../components/maps/MapView';
import PropertyMarker from '../../components/maps/PropertyMarker';
import InfoCard from '../../components/maps/InfoCard';
import { Search, Heart, Share2, MapPin, Map as MapIcon, HelpCircle, ChevronLeft, SlidersHorizontal, ArrowRight, Bell, ChevronDown, Menu } from 'lucide-react';
import { Brand } from '../../config/brand';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Card, Badge, Skeleton, EmptyState, Popover, PageTransition, StaggerList } from '../../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';



export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // State from URL
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [roomType, setRoomType] = useState(searchParams.get('room_type') || '');
  const [genderType, setGenderType] = useState(searchParams.get('gender_type') || '');
  const [isAc, setIsAc] = useState(searchParams.get('is_ac') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'price_asc');
  
  // Existing advanced filters to preserve
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [collegeId, setCollegeId] = useState(searchParams.get('college_id') || '');
  const [radiusKm, setRadiusKm] = useState(searchParams.get('radius_km') || '');
  const [sharing, setSharing] = useState(searchParams.get('sharing') || '');
  const [food, setFood] = useState(searchParams.get('food') === 'true');
  const [selectedFacilities, setSelectedFacilities] = useState(searchParams.get('facilities') ? searchParams.get('facilities').split(',') : []);
  const [availableFrom, setAvailableFrom] = useState(searchParams.get('available_from') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const [properties, setProperties] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [compareList, setCompareList] = useState([]);
  const [bounds, setBounds] = useState(null);
  const abortControllerRef = useRef(null);
  
  // UI State
  const [activePopover, setActivePopover] = useState(null); // 'price', 'room', 'more'
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  useEffect(() => {
    if (token && user?.role === 'student') {
      fetch(`${API}/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).then(data => {
          if (Array.isArray(data)) setWishlistSet(new Set(data.map(item => item.property_id)));
        }).catch(() => {});
    }
  }, [token, user]);

  const fetchProperties = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    if (area) params.set('area', area);
    if (collegeId) params.set('college_id', collegeId);
    if (radiusKm) params.set('radius_km', radiusKm);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (roomType) params.set('room_type', roomType);
    if (sharing) params.set('sharing', sharing);
    if (genderType) params.set('gender_type', genderType);
    if (isAc) params.set('is_ac', 'true');
    if (food) params.set('food', 'true');
    if (selectedFacilities.length > 0) params.set('facilities', selectedFacilities.join(','));
    if (availableFrom) params.set('available_from', availableFrom);
    if (bounds) {
      params.set('north', bounds.north);
      params.set('south', bounds.south);
      params.set('east', bounds.east);
      params.set('west', bounds.west);
    }
    if (sort) params.set('sort', sort);
    params.set('page', page.toString());
    params.set('page_size', '20');

    setSearchParams(params);

    Promise.all([
      fetch(`${API}/properties?${params.toString()}`, { signal }).then(r => r.json()),
      fetch(`${API}/properties/map?${params.toString()}`, { signal }).then(r => r.json())
    ])
    .then(([listData, mapData]) => {
      setProperties(listData.items || []);
      setTotal(listData.total || 0);
      setMapMarkers(mapData || []);
      setLoading(false);
    })
    .catch(err => {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, sort, bounds]);

  const handleApplyFilter = () => {
    setActivePopover(null);
    setPage(1);
    fetchProperties();
  };

  const toggleWishlist = async (propertyId, e) => {
    e.preventDefault();
    if (!token) return navigate('/login');
    const isSaved = wishlistSet.has(propertyId);
    try {
      const res = await fetch(`${API}/wishlist${isSaved ? `/${propertyId}` : ''}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: !isSaved ? JSON.stringify({ property_id: propertyId }) : undefined,
      });
      if (res.ok) {
        setWishlistSet(prev => {
          const next = new Set(prev);
          isSaved ? next.delete(propertyId) : next.add(propertyId);
          return next;
        });
      }
    } catch (e) {}
  };

  const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  // Handle map interaction
  const [selectedMarker, setSelectedMarker] = useState(null);

  return (
    <PageTransition>
      <div className="h-screen w-full bg-[#E5ECEF] lg:p-6 flex items-center justify-center relative overflow-hidden">
        
        {/* Floating App Container */}
        <div className="w-full max-w-[1600px] h-full lg:h-[calc(100vh-3rem)] bg-white lg:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Mobile Map Toggle */}
        <button 
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 btn-cta shadow-float px-8 gap-2"
          onClick={() => setShowMobileMap(!showMobileMap)}
        >
          {showMobileMap ? 'List View' : <><MapIcon size={18}/> Map View</>}
        </button>

        {/* Left List Panel */}
        <div className={`lg:w-[60%] w-full h-full overflow-y-auto p-6 md:p-10 flex flex-col no-scrollbar ${showMobileMap ? 'hidden lg:flex' : 'flex'} bg-white relative z-10`}>
          
          {/* Custom Header matching Dribbble */}
          <div className="flex justify-between items-center mb-10">
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
                <Link to="/wishlist" className="btn-light-circle relative bg-gray-50">
                  <Heart size={18} />
                  {wishlistSet.size > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">{wishlistSet.size}</span>}
                </Link>
              )}
              
              {user ? (
                <>
                  <Link to={`/${user.role}/notifications`} className="btn-light-circle bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Bell size={18} />
                  </Link>
                  <Link to={user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/student/profile'} className="w-10 h-10 rounded-full bg-brand-sky text-white flex items-center justify-center font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-brand-sky/50 transition-all">
                    {user.name[0].toUpperCase()}
                  </Link>
                  <Popover
                    isOpen={activePopover === 'menu'}
                    onClose={() => setActivePopover(null)}
                    align="right"
                    trigger={
                      <button onClick={() => setActivePopover('menu')} className="btn-light-circle bg-gray-50 ml-1 hover:bg-gray-100 transition-colors">
                         <Menu size={18} />
                      </button>
                    }
                  >
                    <div className="p-2 w-48 flex flex-col gap-1">
                      {user.role === 'student' && (
                        <>
                          <Link to="/search" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Explore Hostels</Link>
                          <Link to="/student/bookings" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">My Bookings</Link>
                          <div className="h-px bg-gray-100 my-1"></div>
                          <Link to="/student/profile" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Profile Settings</Link>
                        </>
                      )}
                      
                      {user.role === 'owner' && (
                        <>
                          <Link to="/owner" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Owner Dashboard</Link>
                          <Link to="/owner/properties" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">My Properties</Link>
                          <Link to="/owner/bookings" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Manage Bookings</Link>
                          <div className="h-px bg-gray-100 my-1"></div>
                          <Link to="/owner/kyc" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">KYC & Profile</Link>
                        </>
                      )}

                      {user.role === 'admin' && (
                        <>
                          <Link to="/admin" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Admin Dashboard</Link>
                          <Link to="/admin/users" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Manage Users</Link>
                          <Link to="/admin/properties" className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg hover:text-brand-navy">Manage Properties</Link>
                        </>
                      )}
                    </div>
                  </Popover>
                </>
              ) : (
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-brand-navy px-2">Log in</Link>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight flex items-center gap-2">
              Hostels <span className="text-gray-300 text-sm">▼</span>
            </h1>
            <p className="text-gray-400 font-medium text-xs mt-2 uppercase tracking-wide">Especially for you {todayStr}</p>
          </div>

          {/* Search Bar */}
          <form className="relative mb-6" onSubmit={(e) => { e.preventDefault(); handleApplyFilter(); }}>
            <input
              type="text"
              placeholder="Search by city, college, or name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-full py-4 pl-12 pr-16 text-gray-800 shadow-float focus:outline-none focus:ring-2 focus:ring-brand-sky font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-navy text-white rounded-full flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all">
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Filters Pills Row */}
          <div className="flex flex-wrap gap-3 mb-8 relative z-30">
            {/* Price Popover */}
            <Popover
              isOpen={activePopover === 'price'}
              onClose={() => setActivePopover(null)}
              trigger={
                <button onClick={() => setActivePopover('price')} className="bg-white px-5 py-2.5 rounded-full shadow-sm text-sm font-bold text-gray-700 hover:shadow-md transition-all border border-gray-100 flex items-center gap-2">
                  Price {(minPrice || maxPrice) && <span className="w-2 h-2 rounded-full bg-brand-orange"></span>}
                </button>
              }
            >
              <div className="p-5">
                <h4 className="font-bold text-brand-navy mb-4">Price range (monthly)</h4>
                <div className="flex gap-4 mb-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Min</label>
                    <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="w-full border-b border-gray-200 py-1 text-sm font-semibold focus:outline-none focus:border-brand-sky" placeholder="₹0" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Max</label>
                    <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="w-full border-b border-gray-200 py-1 text-sm font-semibold focus:outline-none focus:border-brand-sky" placeholder="₹100k+" />
                  </div>
                </div>
                <Button className="w-full" onClick={handleApplyFilter}>Apply</Button>
              </div>
            </Popover>

            {/* Room Popover */}
            <Popover
              isOpen={activePopover === 'room'}
              onClose={() => setActivePopover(null)}
              trigger={
                <button onClick={() => setActivePopover('room')} className="bg-white px-5 py-2.5 rounded-full shadow-sm text-sm font-bold text-gray-700 hover:shadow-md transition-all border border-gray-100 flex items-center gap-2">
                  Room {(roomType || genderType) && <span className="w-2 h-2 rounded-full bg-brand-orange"></span>}
                </button>
              }
            >
              <div className="p-5">
                <h4 className="font-bold text-brand-navy mb-3">Room Type</h4>
                <div className="flex flex-col gap-2 mb-4">
                  {['', 'single', 'double', 'triple'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="radio" name="roomType" checked={roomType===t} onChange={() => setRoomType(t)} className="accent-brand-orange" />
                      {t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Any Room'}
                    </label>
                  ))}
                </div>
                <h4 className="font-bold text-brand-navy mb-3">Gender Type</h4>
                <div className="flex flex-col gap-2 mb-4">
                  {['', 'boys_hostel', 'girls_hostel', 'coed'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="radio" name="genderType" checked={genderType===t} onChange={() => setGenderType(t)} className="accent-brand-orange" />
                      {t ? t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Any Type'}
                    </label>
                  ))}
                </div>
                <Button className="w-full" onClick={handleApplyFilter}>Apply</Button>
              </div>
            </Popover>
            
            {/* Advanced Toggle */}
            <button onClick={() => setActivePopover(activePopover === 'more' ? null : 'more')} className="bg-white w-10 h-10 rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-navy transition-all border border-gray-100 relative">
              <SlidersHorizontal size={16} />
              {(isAc || food || selectedFacilities.length > 0) && <span className="absolute top-0 right-0 w-3 h-3 bg-brand-orange border-2 border-white rounded-full"></span>}
            </button>
          </div>

          {/* Results Header */}
          <div className="flex justify-between items-center mb-6 z-20">
            <span className="font-bold text-gray-800 bg-white px-4 py-1.5 rounded-full text-sm shadow-sm border border-gray-100">
              {total} offers
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              Sort: 
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="bg-transparent border-none outline-none text-brand-navy cursor-pointer">
                <option value="price_asc">Price Low to High</option>
                <option value="price_desc">Price High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Listings */}
          <div className="flex-1 flex flex-col gap-5 pb-20 relative z-10">
            {loading ? (
              <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : properties.length === 0 ? (
              <EmptyState title="No properties found" description="Try adjusting your search or filters to see more results." />
            ) : (
              <StaggerList>
                {properties.map(p => (
                  <Card 
                    key={p.property_id} 
                    className="flex flex-col sm:flex-row hover:-translate-y-1 hover:shadow-float transition-all duration-300 group cursor-pointer h-full"
                    onMouseEnter={() => setHoveredCard(p.property_id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => navigate(`/properties/${p.property_id}`)}
                  >
                    <div className="sm:w-[220px] h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                      <img src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-600 hover:text-brand-navy shadow-sm transition" onClick={(e) => { e.stopPropagation(); /* share logic */ }}>
                          <Share2 size={14} />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-110 shadow-sm transition" onClick={(e) => toggleWishlist(p.property_id, e)}>
                          <Heart size={14} className={wishlistSet.has(p.property_id) ? "fill-brand-orange text-brand-orange" : "text-gray-600"} />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-brand-navy text-lg leading-tight mb-1">{p.name}</h3>
                        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-3">
                          <MapPin size={12} /> {p.area ? `${p.area}, ` : ''}{p.city}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {p.facilities?.slice(0, 3).map(f => (
                            <span key={f} className="text-[10px] uppercase font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md tracking-wider">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between mt-auto">
                        <Button className="!px-4 !py-2 !text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/properties/${p.property_id}`); }}>
                          More details
                        </Button>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 mb-1">
                            <span className="text-brand-yellow text-sm">★</span>
                            <span className="font-bold text-sm text-brand-navy">{p.avg_rating || 'New'}</span>
                            <span className="text-xs font-medium text-gray-400">(12)</span>
                          </div>
                          <div className="font-extrabold text-xl text-brand-navy">
                            ₹{p.min_rent.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold uppercase">/ month</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </StaggerList>
            )}
          </div>
        </div>

        {/* Right Map Panel */}
        <div className={`lg:w-[40%] h-full hidden lg:block bg-gray-100 relative ${showMobileMap ? '!block w-full' : ''}`}>
          <GoogleMapsProvider properties={mapMarkers}>
            <MapView 
              center={{ lat: 28.6139, lng: 77.2090 }} 
              zoom={12} 
              onBoundsChanged={setBounds}
              autoLocate={true}
            >
              {mapMarkers.map(m => (
                <PropertyMarker
                  key={m.property_id || m.id}
                  property={m}
                  isHovered={hoveredCard === (m.property_id || m.id)}
                  isSelected={selectedMarker?.property_id === (m.property_id || m.id)}
                  onClick={() => setSelectedMarker(m)}
                />
              ))}
              {selectedMarker && (
                <div className="absolute top-4 right-4 z-50 pointer-events-auto">
                  <div className="relative">
                    <button 
                      onClick={() => setSelectedMarker(null)} 
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow border flex items-center justify-center font-bold text-gray-500 z-10 hover:bg-gray-100"
                    >
                      ×
                    </button>
                    <InfoCard property={selectedMarker} />
                  </div>
                </div>
              )}
            </MapView>
          </GoogleMapsProvider>
          
          <button onClick={() => navigate(-1)} className="absolute top-10 left-6 z-[400] w-10 h-10 bg-white rounded-xl shadow-soft flex items-center justify-center text-gray-600 hover:text-brand-navy pointer-events-auto">
            <ChevronLeft size={20} />
          </button>
          <button className="absolute bottom-10 right-10 z-[400] w-14 h-14 bg-brand-navy text-white rounded-full shadow-float flex items-center justify-center hover:scale-105 transition-transform pointer-events-auto">
            <HelpCircle size={24} />
          </button>
        </div>

        </div>
      </div>
    </PageTransition>
  );
}
