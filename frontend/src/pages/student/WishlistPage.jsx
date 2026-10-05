import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function WishlistPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch(`${API}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    } catch (e) {
      alert('Failed to remove item');
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6 text-center text-gray-500">Loading wishlist...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="bg-white p-12 border rounded-xl text-center space-y-4">
          <span className="text-4xl">❤️</span>
          <h3 className="text-xl font-bold text-gray-800">Your wishlist is empty</h3>
          <p className="text-gray-500 text-sm">Save properties while searching to compare and view them later.</p>
          <Link
            to="/search"
            className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Explore Hostels & PGs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <div key={p.property_id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative h-44 bg-gray-100">
                <img
                  src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500'}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeItem(p.property_id)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow text-xs font-bold text-red-600"
                >
                  ✕ Remove
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{p.name}</h3>
                  <p className="text-xs text-gray-500">📍 {p.area ? `${p.area}, ` : ''}{p.city}</p>
                  <p className="text-indigo-600 font-extrabold text-sm mt-2">
                    Rent: ₹{p.min_rent?.toLocaleString()} {p.max_rent > p.min_rent ? `- ₹${p.max_rent?.toLocaleString()}` : ''} / mo
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    p.available_beds_count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.available_beds_count > 0 ? `${p.available_beds_count} Available` : 'Sold Out'}
                  </span>
                  <Link
                    to={`/properties/${p.property_id}`}
                    className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-indigo-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
