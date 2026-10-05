import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetch(`${API}/properties/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Property not found or not approved');
        return r.json();
      })
      .then((data) => {
        setProperty(data);
        if (data.photos && data.photos.length > 0) {
          setSelectedPhoto(data.photos[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Check wishlist status for logged-in student
  useEffect(() => {
    if (token && user?.role === 'student') {
      fetch(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setIsWishlisted(data.some((item) => item.property_id === id));
          }
        })
        .catch(() => {});
    }
  }, [id, token, user]);

  const toggleWishlist = async () => {
    if (!token) {
      alert('Please log in as a student to save to your wishlist.');
      return navigate('/login');
    }
    const method = isWishlisted ? 'DELETE' : 'POST';
    const url = isWishlisted ? `${API}/wishlist/${id}` : `${API}/wishlist`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: !isWishlisted ? JSON.stringify({ property_id: id }) : undefined,
      });
      if (res.ok) setIsWishlisted(!isWishlisted);
    } catch (e) {
      alert('Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded-xl"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white border rounded-xl text-center shadow-sm">
        <span className="text-4xl">🚫</span>
        <h2 className="text-2xl font-bold text-gray-800 mt-2">Property Not Found</h2>
        <p className="text-gray-500 mt-2">This property is unavailable or pending admin verification.</p>
        <Link
          to="/search"
          className="inline-block mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  const photos = property.photos || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <Link to="/search" className="hover:text-indigo-600 font-medium">
          ← Back to Properties
        </Link>
        <button
          onClick={toggleWishlist}
          className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg hover:bg-gray-50 font-medium transition"
        >
          {isWishlisted ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
        </button>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900">{property.name}</h1>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
              {property.type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600 mt-1">📍 {property.address}, {property.area ? `${property.area}, ` : ''}{property.city}</p>
        </div>
        {property.avg_rating && (
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-center">
            <span className="text-xl font-extrabold text-amber-700">⭐ {property.avg_rating}</span>
            <span className="block text-xs text-amber-600 font-medium">Average Rating</span>
          </div>
        )}
      </div>

      {/* Photo Gallery */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
        <div className="h-96 w-full bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={selectedPhoto || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000'}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        </div>
        {photos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photos.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt=""
                onClick={() => setSelectedPhoto(url)}
                className={`w-24 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${
                  selectedPhoto === url ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Description, Facilities & Rules */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {property.description && (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-2">About Property</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{property.description}</p>
            </div>
          )}

          {/* Facilities */}
          {property.facilities && property.facilities.length > 0 && (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Amenities & Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {property.facilities.map((fac) => (
                  <span key={fac} className="bg-indigo-50 text-indigo-700 font-medium text-xs px-3 py-1.5 rounded-lg border border-indigo-100">
                    ✓ {fac}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {property.house_rules && (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-2">House Rules</h3>
              <p className="text-gray-600 text-sm whitespace-pre-line">{property.house_rules}</p>
            </div>
          )}

          {/* Rooms & Live Availability Table */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Rooms & Available Beds</h3>
            {(!property.rooms || property.rooms.length === 0) ? (
              <p className="text-sm text-gray-500 italic">No room details listed.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b">
                    <tr>
                      <th className="p-3">Room</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">AC</th>
                      <th className="p-3">Bath</th>
                      <th className="p-3">Rent</th>
                      <th className="p-3">Live Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {property.rooms.map((r) => (
                      <tr key={r.room_id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{r.room_number} {r.floor ? `(Fl. ${r.floor})` : ''}</td>
                        <td className="p-3 capitalize">{r.room_type} ({r.capacity}-share)</td>
                        <td className="p-3">{r.is_ac ? '⚡ Yes' : 'No'}</td>
                        <td className="p-3">{r.attached_bath ? '🛁 Attached' : 'Shared'}</td>
                        <td className="p-3 font-bold text-indigo-600">₹{r.monthly_rent?.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            r.available_beds_count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {r.available_beds_count > 0 ? `${r.available_beds_count} Bed(s) Available` : 'Sold Out'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Policies & Booking Widget */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Policies & Terms</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Security Deposit</span>
                <span className="font-semibold text-gray-900">
                  {property.security_deposit_default ? `₹${property.security_deposit_default.toLocaleString()}` : 'Standard'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Notice Period</span>
                <span className="font-semibold text-gray-900">
                  {property.notice_period_days ? `${property.notice_period_days} Days` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lock-in Period</span>
                <span className="font-semibold text-gray-900">
                  {property.lock_in_months ? `${property.lock_in_months} Month(s)` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Mode</span>
                <span className="font-semibold text-gray-900 capitalize">{property.booking_mode}</span>
              </div>
            </div>

            {/* Booking CTA Button (Disabled for Phase 3) */}
            <div className="pt-4 border-t space-y-2">
              <button
                disabled
                className="w-full bg-gray-300 text-gray-600 font-bold py-3 rounded-xl cursor-not-allowed text-center"
              >
                Book Now
              </button>
              <p className="text-xs text-center text-gray-400 font-medium">
                🔒 Online bookings & instant reservations arrive in Phase 4
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
