import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const STATUS_BADGE = {
  Draft:    'bg-gray-100 text-gray-700',
  Pending:  'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-700',
  Inactive: 'bg-gray-200 text-gray-500',
};

export default function PropertiesList() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/properties/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setProperties(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const submitForReview = async (id) => {
    await fetch(`${API}/properties/${id}/submit`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this property?')) return;
    const r = await fetch(`${API}/properties/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok || r.status === 204) load();
    else { const d = await r.json(); alert(d.detail); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <Link to="/owner/properties/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 transition">
          + Add Property
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
          No properties yet. <Link to="/owner/properties/new" className="text-indigo-600 font-semibold">Add your first one →</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {properties.map(p => (
            <div key={p.property_id} className="bg-white rounded-xl shadow p-5 flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg text-gray-900">{p.name}</h2>
                <p className="text-sm text-gray-500">{p.city} · {p.type?.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400 mt-1">{p.address}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[p.status] || 'bg-gray-100'}`}>
                  {p.status}
                </span>
                <div className="flex gap-2">
                  <Link to={`/owner/properties/${p.property_id}/rooms`}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition">
                    Rooms
                  </Link>
                  {p.status === 'Draft' && (
                    <button onClick={() => submitForReview(p.property_id)}
                      className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded transition">
                      Submit for Review
                    </button>
                  )}
                  <button onClick={() => deactivate(p.property_id)}
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition">
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
