import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

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
    return <div className="max-w-5xl mx-auto p-8 text-center text-gray-500">Loading comparison...</div>;
  }

  if (error || properties.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white border rounded-xl text-center space-y-4 shadow-sm">
        <span className="text-4xl">⚖️</span>
        <h2 className="text-2xl font-bold text-gray-800">Compare Properties</h2>
        <p className="text-gray-500 text-sm">{error || 'Select up to 3 properties from the search results to compare.'}</p>
        <Link to="/search" className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Property Comparison</h1>
        <Link to="/search" className="text-sm text-indigo-600 hover:underline font-semibold">
          ← Back to Search
        </Link>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4 text-xs uppercase text-gray-500 w-1/4">Feature</th>
              {properties.map((p) => (
                <th key={p.property_id} className="p-4 text-center border-l w-1/4">
                  <img
                    src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300'}
                    alt={p.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <Link to={`/properties/${p.property_id}`} className="font-bold text-gray-900 hover:text-indigo-600 text-base block">
                    {p.name}
                  </Link>
                  <span className="text-xs text-gray-500 block">📍 {p.city}, {p.area}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Gender / Type</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l capitalize font-medium">
                  {p.type.replace('_', ' ')}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Monthly Rent Range</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l font-bold text-indigo-600">
                  ₹{p.min_rent?.toLocaleString()} {p.max_rent > p.min_rent ? `- ₹${p.max_rent?.toLocaleString()}` : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Security Deposit</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l">
                  {p.security_deposit_default ? `₹${p.security_deposit_default?.toLocaleString()}` : 'Standard'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Available Beds</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    p.available_beds_count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.available_beds_count} Beds Available
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Notice Period</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l">
                  {p.notice_period_days ? `${p.notice_period_days} Days` : 'N/A'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Lock-in Period</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l">
                  {p.lock_in_months ? `${p.lock_in_months} Month(s)` : 'None'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Facilities</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l text-xs">
                  {p.facilities && p.facilities.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {p.facilities.map((f) => (
                        <span key={f} className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{f}</span>
                      ))}
                    </div>
                  ) : 'N/A'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-semibold text-gray-700 bg-gray-50/50">Average Rating</td>
              {properties.map((p) => (
                <td key={p.property_id} className="p-4 text-center border-l font-bold text-amber-600">
                  {p.avg_rating ? `⭐ ${p.avg_rating}` : 'No ratings yet'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
