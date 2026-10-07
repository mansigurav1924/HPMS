import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartOff, MapPin } from 'lucide-react';
import { Button, Card, Badge, PageTransition, StaggerList, Skeleton, EmptyState } from '../../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WishlistPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetch(`${API}/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, navigate]);

  const removeItem = async (propertyId) => {
    try {
      const res = await fetch(`${API}/wishlist/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems(items.filter((i) => i.property_id !== propertyId));
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-pulse space-y-8">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight">My Wishlist</h1>
          <p className="text-gray-500 font-medium mt-2">Saved properties you want to keep an eye on.</p>
        </div>

        {items.length === 0 ? (
          <EmptyState 
            icon={<HeartOff size={48} className="text-gray-300" />}
            title="Your wishlist is empty" 
            description="Save properties while searching to compare and view them later." 
            action={<Button onClick={() => navigate('/search')}>Explore Hostels</Button>} 
          />
        ) : (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {items.map((p) => (
                <motion.div
                  key={p.property_id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full flex flex-col group hover:-translate-y-1 hover:shadow-float transition-all duration-300 cursor-pointer" onClick={() => navigate(`/properties/${p.property_id}`)}>
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(p.property_id); }}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur hover:bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-sm text-red-500 hover:text-red-600 hover:scale-110 transition-all"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-brand-navy text-lg leading-tight mb-1">{p.name}</h3>
                        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1 mb-3">
                          <MapPin size={12} /> {p.area ? `${p.area}, ` : ''}{p.city}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Starts From</p>
                          <p className="text-brand-navy font-extrabold text-lg">
                            ₹{p.min_rent?.toLocaleString()} <span className="text-xs text-gray-400 font-bold uppercase">/ mo</span>
                          </p>
                        </div>
                        {p.available_beds_count > 0 
                          ? <Badge className="bg-green-100 text-green-700 border border-green-200">{p.available_beds_count} left</Badge>
                          : <Badge className="bg-red-100 text-red-700 border border-red-200">Sold Out</Badge>
                        }
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </StaggerList>
        )}
      </div>
    </PageTransition>
  );
}
