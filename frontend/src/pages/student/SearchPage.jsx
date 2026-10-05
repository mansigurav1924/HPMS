import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FACILITIES_LIST = ['WiFi', 'Meals', 'Laundry', 'Parking', 'Security', 'Power Backup', 'Gym', 'Cleaning', 'Water Purifier'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // State initialized from URL searchParams
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [collegeId, setCollegeId] = useState(searchParams.get('college_id') || '');
  const [radiusKm, setRadiusKm] = useState(searchParams.get('radius_km') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [roomType, setRoomType] = useState(searchParams.get('room_type') || '');
  const [sharing, setSharing] = useState(searchParams.get('sharing') || '');
  const [genderType, setGenderType] = useState(searchParams.get('gender_type') || '');
  const [isAc, setIsAc] = useState(searchParams.get('is_ac') === 'true');
  const [food, setFood] = useState(searchParams.get('food') === 'true');
  const [selectedFacilities, setSelectedFacilities] = useState(
    searchParams.get('facilities') ? searchParams.get('facilities').split(',') : []
  );
  const [availableFrom, setAvailableFrom] = useState(searchParams.get('available_from') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'price_asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const [colleges, setColleges] = useState([]);
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [compareList, setCompareList] = useState([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Load Colleges
  useEffect(() => {
    fetch(`${API}/colleges`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setColleges(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Load Wishlist for authenticated student
  useEffect(() => {
    if (token && user?.role === 'student') {
      fetch(`${API}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setWishlistSet(new Set(data.map((item) => item.property_id)));
          }
        })
        .catch(() => {});
    }
  }, [token, user]);

  // Sync state to URL searchParams & trigger search fetch
  const fetchProperties = () => {
    setLoading(true);
    setError(null);

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
    if (sort) params.set('sort', sort);
    params.set('page', page.toString());
    params.set('page_size', '10');

    setSearchParams(params);

    fetch(`${API}/properties?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load properties');
        return r.json();
      })
      .then((data) => {
        setProperties(data.items || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProperties();
  }, [page, sort]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchProperties();
    setShowFilterDrawer(false);
  };

  const handleClearFilters = () => {
    setQ('');
    setCity('');
    setArea('');
    setCollegeId('');
    setRadiusKm('');
    setMinPrice('');
    setMaxPrice('');
    setRoomType('');
    setSharing('');
    setGenderType('');
    setIsAc(false);
    setFood(false);
    setSelectedFacilities([]);
    setAvailableFrom('');
    setSort('price_asc');
    setPage(1);
    setSearchParams({});
    setTimeout(() => fetchProperties(), 0);
  };

  const toggleWishlist = async (propertyId) => {
    if (!token) {
      alert('Please log in as a student to save properties to your wishlist.');
      return navigate('/login');
    }
    const isSaved = wishlistSet.has(propertyId);
    const method = isSaved ? 'DELETE' : 'POST';
    const url = isSaved ? `${API}/wishlist/${propertyId}` : `${API}/wishlist`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: !isSaved ? JSON.stringify({ property_id: propertyId }) : undefined,
      });
      if (res.ok) {
        setWishlistSet((prev) => {
          const next = new Set(prev);
          if (isSaved) next.delete(propertyId);
          else next.add(propertyId);
          return next;
        });
      }
    } catch (e) {
      alert('Failed to update wishlist');
    }
  };

  const toggleCompare = (propertyId) => {
    if (compareList.includes(propertyId)) {
      setCompareList(compareList.filter((id) => id !== propertyId));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 properties at a time.');
        return;
      }
      setCompareList([...compareList, propertyId]);
    }
  };

  const toggleFacility = (fac) => {
    if (selectedFacilities.includes(fac)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== fac));
    } else {
      setSelectedFacilities([...selectedFacilities, fac]);
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="min-h-screen pb-12">
      {/* Search Header Bar */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-10 p-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Main Search Input */}
          <form onSubmit={handleApplyFilters} className="flex flex-1 w-full gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search hostel name, area, city, description..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg transition"
            >
              Search
            </button>
          </form>

          {/* Quick Controls */}
          <div className="flex gap-3 w-full md:w-auto items-center justify-between">
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <span>⚙️</span> Filters
              {(selectedFacilities.length > 0 || minPrice || maxPrice || genderType || roomType || collegeId) && (
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-300 py-2 px-3 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="price_asc">Rent: Low to High</option>
              <option value="price_desc">Rent: High to Low</option>
              <option value="distance">Distance from College</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest First</option>
            </select>

            {/* Compare Drawer Bar */}
            {compareList.length > 0 && (
              <button
                onClick={() => navigate(`/properties/compare?ids=${compareList.join(',')}`)}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700"
              >
                Compare ({compareList.length}/3)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter Drawer / Sidebar */}
        <div className={`md:block ${showFilterDrawer ? 'block' : 'hidden'} bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-6 h-fit`}>
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-gray-800 text-lg">Filter Properties</h3>
            <button onClick={handleClearFilters} className="text-xs text-indigo-600 hover:underline font-semibold">
              Reset All
            </button>
          </div>

          {/* Gender Type */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Gender / Type</label>
            <select
              value={genderType}
              onChange={(e) => setGenderType(e.target.value)}
              className="w-full border p-2 rounded text-sm"
            >
              <option value="">All Types</option>
              <option value="boys_hostel">Boys Hostel</option>
              <option value="girls_hostel">Girls Hostel</option>
              <option value="coed">Co-Ed Hostel</option>
              <option value="pg">PG Accommodation</option>
            </select>
          </div>

          {/* College Proximity Filter */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Near College</label>
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full border p-2 rounded text-sm mb-2"
            >
              <option value="">Select College</option>
              {colleges.map((c) => (
                <option key={c.college_id} value={c.college_id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
            {collegeId && (
              <div>
                <label className="block text-xs text-gray-500">Max Radius: {radiusKm || '5'} km</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={radiusKm || '5'}
                  onChange={(e) => setRadiusKm(e.target.value)}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Monthly Rent (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 border p-2 rounded text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 border p-2 rounded text-sm"
              />
            </div>
          </div>

          {/* Room Type & Sharing */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Room & Sharing</label>
            <div className="space-y-2 text-sm">
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full border p-2 rounded text-sm mb-2"
              >
                <option value="">Any Room Type</option>
                <option value="single">Single Room</option>
                <option value="double">Double Sharing</option>
                <option value="triple">Triple Sharing</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </div>
          </div>

          {/* AC & Food Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isAc}
                onChange={(e) => setIsAc(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Air Conditioned (AC)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={food}
                onChange={(e) => setFood(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Food / Mess Included
            </label>
          </div>

          {/* Facilities Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Facilities</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {FACILITIES_LIST.map((fac) => (
                <label key={fac} className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedFacilities.includes(fac)}
                    onChange={() => toggleFacility(fac)}
                    className="rounded text-indigo-600"
                  />
                  {fac}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleApplyFilters}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
          >
            Apply Filters
          </button>
        </div>

        {/* Results List */}
        <div className="md:col-span-3">
          {/* Header count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-600">
              Showing <span className="font-bold text-gray-900">{total}</span> properties
            </p>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-4 rounded-xl border border-gray-200 animate-pulse flex gap-4">
                  <div className="w-36 h-36 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center">
              <p className="font-semibold mb-2">Failed to load properties.</p>
              <button
                onClick={fetchProperties}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && properties.length === 0 && (
            <div className="bg-white border border-gray-200 p-12 rounded-xl text-center space-y-4">
              <span className="text-4xl">🏢</span>
              <h3 className="text-xl font-bold text-gray-800">No rooms match your filters</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Try expanding your price range, clearing facility checkboxes, or removing area restrictions.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Property Cards */}
          {!loading && !error && properties.length > 0 && (
            <div className="grid gap-5">
              {properties.map((p) => {
                const isWishlisted = wishlistSet.has(p.property_id);
                const isCompared = compareList.includes(p.property_id);

                return (
                  <div
                    key={p.property_id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row overflow-hidden group"
                  >
                    {/* Cover Photo */}
                    <div className="sm:w-56 h-48 sm:h-auto bg-gray-100 relative overflow-hidden flex-shrink-0">
                      <img
                        src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500'}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 rounded text-xs font-semibold capitalize">
                        {p.type.replace('_', ' ')}
                      </span>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(p.property_id)}
                        className="absolute top-3 right-3 bg-white/80 hover:bg-white p-1.5 rounded-full shadow text-sm transition"
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        {isWishlisted ? '❤️' : '🤍'}
                      </button>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <Link to={`/properties/${p.property_id}`}>
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">
                              {p.name}
                            </h3>
                          </Link>
                          {p.avg_rating && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              ⭐ {p.avg_rating}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          📍 {p.area ? `${p.area}, ` : ''}{p.city}
                          {p.distance_km !== null && p.distance_km !== undefined && (
                            <span className="ml-2 font-medium text-indigo-600">({p.distance_km} km away)</span>
                          )}
                        </p>

                        {/* Facilities Badges */}
                        {p.facilities && p.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {p.facilities.slice(0, 4).map((f) => (
                              <span key={f} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                {f}
                              </span>
                            ))}
                            {p.facilities.length > 4 && (
                              <span className="text-xs text-gray-400">+{p.facilities.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-400">Rent Starting From</p>
                          <p className="text-lg font-extrabold text-indigo-600">
                            ₹{p.min_rent.toLocaleString()} {p.max_rent > p.min_rent ? `- ₹${p.max_rent.toLocaleString()}` : ''}
                            <span className="text-xs text-gray-500 font-normal"> / mo</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCompare(p.property_id)}
                            className={`text-xs px-3 py-1.5 rounded font-medium border transition ${
                              isCompared
                                ? 'bg-purple-100 text-purple-700 border-purple-300'
                                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {isCompared ? '✓ Compared' : '+ Compare'}
                          </button>

                          <Link
                            to={`/properties/${p.property_id}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
