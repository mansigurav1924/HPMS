import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import GoogleMapsProvider from '../../components/maps/GoogleMapsProvider';
import MapView from '../../components/maps/MapView';
import PropertyMarker from '../../components/maps/PropertyMarker';
import CollegeMarker from '../../components/maps/CollegeMarker';
import { Heart, Share2, MapPin, ChevronLeft, ChevronRight, Check, CheckCircle2, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Skeleton, PageTransition, Reveal } from '../../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';



export default function PropertyDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/properties/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Property not found or not approved');
        return r.json();
      })
      .then(data => {
        setProperty(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    fetch(`${API}/colleges`)
      .then(r => r.json())
      .then(data => setColleges(data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (token && user?.role === 'student') {
      fetch(`${API}/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).then(data => {
          if (Array.isArray(data)) setIsWishlisted(data.some(item => item.property_id === id));
        }).catch(() => {});
    }
  }, [id, token, user]);

  const toggleWishlist = async () => {
    if (!token) return navigate('/login');
    const method = isWishlisted ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`${API}/wishlist${isWishlisted ? `/${id}` : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: !isWishlisted ? JSON.stringify({ property_id: id }) : undefined,
      });
      if (res.ok) setIsWishlisted(!isWishlisted);
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-pulse space-y-8 mt-10">
        <Skeleton className="h-[500px] w-full rounded-3xl" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-3xl shadow-soft text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-extrabold text-brand-navy">Property Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6">This property is unavailable or pending verification.</p>
        <Button onClick={() => navigate('/search')}>Back to Search</Button>
      </div>
    );
  }

  const photos = property.photos && property.photos.length > 0 ? property.photos : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000'];
  const lat = property.latitude || 28.6139;
  const lng = property.longitude || 77.2090;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto pb-24">
        
        {/* Navigation */}
        <div className="flex justify-between items-center py-6">
          <Link to="/search" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-navy transition">
            <ChevronLeft size={16} /> Back to Search
          </Link>
          <div className="flex gap-3">
            <button className="btn-light-circle"><Share2 size={16} /></button>
            <button className="btn-light-circle" onClick={toggleWishlist}>
              <Heart size={16} className={isWishlisted ? "fill-brand-orange text-brand-orange" : ""} />
            </button>
          </div>
        </div>

        {/* Hero Gallery */}
        <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-soft mb-10 group cursor-pointer" onClick={() => setLightboxOpen(true)}>
          <AnimatePresence initial={false}>
            <motion.img
              key={activePhotoIdx}
              src={photos[activePhotoIdx]}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white z-10">
            <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              {property.type.replace('_', ' ')}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-2 drop-shadow-md">{property.name}</h1>
            <p className="flex items-center gap-2 font-medium text-white/90 drop-shadow-md">
              <MapPin size={16} /> {property.area ? `${property.area}, ` : ''}{property.city}
            </p>
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-2 z-20">
              <button className="btn-light-circle bg-white/20 backdrop-blur text-white border-none hover:bg-white/40" onClick={(e) => { e.stopPropagation(); setActivePhotoIdx(p => p === 0 ? photos.length-1 : p-1)}}>
                <ChevronLeft size={18} />
              </button>
              <button className="btn-light-circle bg-white/20 backdrop-blur text-white border-none hover:bg-white/40" onClick={(e) => { e.stopPropagation(); setActivePhotoIdx(p => p === photos.length-1 ? 0 : p+1)}}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="lg:w-2/3 space-y-12">
            
            <Reveal>
              <h2 className="text-2xl font-extrabold text-brand-navy mb-4">About this place</h2>
              <p className="text-gray-600 leading-relaxed text-lg">{property.description || "A wonderful place to stay with great amenities and connectivity."}</p>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="text-2xl font-extrabold text-brand-navy mb-6">What this place offers</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {(property.facilities && property.facilities.length > 0 ? property.facilities : ['WiFi', 'Meals', 'Laundry', 'Security']).map(fac => (
                  <div key={fac} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-brand-orange border border-gray-100">
                      <CheckCircle2 size={18} />
                    </div>
                    {fac}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-extrabold text-brand-navy">Location</h2>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-brand-navy rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <MapIcon size={16} /> Get Directions
                </a>
              </div>
              <div className="h-[300px] rounded-3xl overflow-hidden shadow-soft border border-gray-100 z-0 relative">
                <GoogleMapsProvider lat={lat} lng={lng}>
                  <MapView center={{ lat, lng }} zoom={14}>
                    <PropertyMarker property={{ lat, lng, min_rent: property.min_rent || 0 }} />
                    {colleges.map(c => (
                      <CollegeMarker key={c.college_id} college={c} />
                    ))}
                  </MapView>
                </GoogleMapsProvider>
              </div>
            </Reveal>

            {property.rooms?.length > 0 && (
              <Reveal delay={0.3}>
                <h2 className="text-2xl font-extrabold text-brand-navy mb-6">Available Rooms</h2>
                <div className="space-y-4">
                  {property.rooms.map((r, i) => (
                    <Card key={i} className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <h4 className="font-bold text-lg text-brand-navy">{r.room_number} <span className="text-sm text-gray-400 capitalize">({r.room_type}, {r.capacity}-share)</span></h4>
                        <div className="flex gap-4 mt-2 text-sm font-medium text-gray-600">
                          {r.is_ac && <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-brand-sky"/> AC</span>}
                          {r.attached_bath && <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-brand-sky"/> Attached Bath</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-xl text-brand-navy mb-1">₹{r.monthly_rent?.toLocaleString()} <span className="text-xs text-gray-400 font-bold uppercase">/ mo</span></div>
                        {r.available_beds_count > 0 
                          ? <Badge className="bg-green-100 text-green-700 border border-green-200">{r.available_beds_count} beds left</Badge>
                          : <Badge className="bg-red-100 text-red-700 border border-red-200">Sold Out</Badge>
                        }
                      </div>
                    </Card>
                  ))}
                </div>
              </Reveal>
            )}

          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:w-1/3">
            <div className="sticky top-28">
              <Card className="p-6 md:p-8 border-t-4 border-t-brand-orange shadow-float">
                <div className="flex items-end gap-2 mb-6 border-b border-gray-100 pb-6">
                  <span className="text-3xl font-extrabold text-brand-navy">₹{property.min_rent?.toLocaleString() || '--'}</span>
                  <span className="text-sm font-bold text-gray-400 uppercase mb-1">/ month</span>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-500">Security Deposit</span>
                    <span className="text-brand-navy">₹{property.security_deposit_default?.toLocaleString() || 'Variable'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-500">Notice Period</span>
                    <span className="text-brand-navy">{property.notice_period_days ? `${property.notice_period_days} Days` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-500">Lock-in</span>
                    <span className="text-brand-navy">{property.lock_in_months ? `${property.lock_in_months} Months` : 'None'}</span>
                  </div>
                </div>

                <Button className="w-full mb-4 opacity-50 cursor-not-allowed">
                  Request to Book
                </Button>
                <p className="text-[11px] font-bold text-center text-gray-400 uppercase tracking-wider">
                  Booking available in Phase 4
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <div className="fixed inset-0 z-[100] bg-brand-navy/95 backdrop-blur-md flex items-center justify-center">
            <button className="absolute top-6 right-6 text-white/50 hover:text-white" onClick={() => setLightboxOpen(false)}>Close</button>
            <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" onClick={() => setActivePhotoIdx(p => p === 0 ? photos.length-1 : p-1)}><ChevronLeft size={48} /></button>
            <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" onClick={() => setActivePhotoIdx(p => p === photos.length-1 ? 0 : p+1)}><ChevronRight size={48} /></button>
            <motion.img 
              key={activePhotoIdx} src={photos[activePhotoIdx]} 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring" }}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
