import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { PageTransition, Skeleton, EmptyState, Button } from '../../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids') || '';
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ids) {
      setLoading(false);
      return;
    }

    fetch(`${API}/properties/compare?ids=${ids}`)
      .then((r) => {
        if (!r.ok) throw new Error('Maximum 3 properties can be compared');
        return r.json();
      })
      .then((data) => {
        setProperties(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [ids]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-pulse space-y-8 mt-10">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || properties.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-3xl shadow-soft text-center">
        <div className="text-6xl mb-4 text-brand-navy">⚖️</div>
        <h2 className="text-2xl font-extrabold text-brand-navy mb-2">Compare Properties</h2>
        <p className="text-gray-500 mb-6 font-medium">{error || 'Select up to 3 properties from the search results to compare.'}</p>
        <Link to="/search" className="btn-cta">Back to Search</Link>
      </div>
    );
  }

  // Find best values
  const minRent = Math.min(...properties.map(p => p.min_rent || Infinity));
  const maxRating = Math.max(...properties.map(p => p.avg_rating || 0));

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy tracking-tight mb-2">Compare</h1>
            <p className="text-gray-500 font-medium">Comparing {properties.length} properties</p>
          </div>
          <Link to="/search" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-navy transition">
            <ChevronLeft size={16} /> Back to Search
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-float overflow-x-auto border border-gray-100">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr>
                <th className="p-6 w-1/4 align-bottom">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Features</h3>
                </th>
                {properties.map((p) => (
                  <th key={p.property_id} className="p-6 border-l border-gray-100 w-[25%] align-top">
                    <div className="relative h-40 bg-gray-100 rounded-2xl overflow-hidden mb-4 group cursor-pointer">
                      <img src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                    <Link to={`/properties/${p.property_id}`} className="text-lg font-extrabold text-brand-navy hover:text-brand-orange transition-colors block mb-1">
                      {p.name}
                    </Link>
                    <span className="text-xs font-semibold text-gray-400">📍 {p.city}, {p.area}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Type</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100 capitalize font-medium text-brand-navy">
                    {p.type.replace('_', ' ')}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Monthly Rent Range</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100">
                    <div className={`font-extrabold text-lg ${p.min_rent === minRent ? 'text-green-600 flex items-center gap-2' : 'text-brand-navy'}`}>
                      ₹{p.min_rent?.toLocaleString()} {p.max_rent > p.min_rent ? `- ₹${p.max_rent?.toLocaleString()}` : ''}
                      {p.min_rent === minRent && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Best Value</span>}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Average Rating</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100">
                    <div className={`font-bold ${p.avg_rating === maxRating && p.avg_rating > 0 ? 'text-brand-orange text-lg' : 'text-gray-600'}`}>
                      {p.avg_rating ? `⭐ ${p.avg_rating}` : 'New'}
                    </div>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Security Deposit</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100 font-medium text-brand-navy">
                    {p.security_deposit_default ? `₹${p.security_deposit_default?.toLocaleString()}` : 'Standard'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Available Beds</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.available_beds_count > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.available_beds_count} Left
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Lock-in Period</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100 font-medium text-brand-navy">
                    {p.lock_in_months ? `${p.lock_in_months} Month(s)` : 'None'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-gray-600">Facilities</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100 align-top">
                    {p.facilities && p.facilities.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {p.facilities.map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <CheckCircle2 size={14} className="text-brand-sky" /> {f}
                          </div>
                        ))}
                      </div>
                    ) : <span className="text-gray-400 font-medium">Not listed</span>}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-6"></td>
                {properties.map((p) => (
                  <td key={p.property_id} className="p-6 border-l border-gray-100 text-center">
                    <Button onClick={() => window.location.href = `/properties/${p.property_id}`} className="w-full">
                      View Details
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
