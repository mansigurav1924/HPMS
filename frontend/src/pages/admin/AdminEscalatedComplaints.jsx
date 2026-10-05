import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
  open:         'bg-blue-100 text-blue-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  in_progress:  'bg-orange-100 text-orange-800',
  resolved:     'bg-green-100 text-green-800',
  closed:       'bg-gray-200 text-gray-700',
  reopened:     'bg-purple-100 text-purple-800',
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100'}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
}

export default function AdminEscalatedComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);

  const load = async (p = 1) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(
        `${API}/complaints?escalated=true&page=${p}&page_size=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      setComplaints(d.complaints || []);
      setTotal(d.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">⚠ Escalated Complaints</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} escalated — all properties</p>
        </div>
        <button onClick={() => load(page)}
          className="text-sm px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error} <button onClick={() => load()} className="underline ml-2">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />)}
        </div>
      ) : complaints.length === 0 && !error ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-3">✅</p>
          <p className="font-medium text-lg">No escalated complaints. All clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.complaint_id}
              className="bg-white rounded-xl shadow-sm border-l-4 border-l-red-500 p-4 flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">
                  {c.category?.replace('_', ' / ')}
                  <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.priority === 'urgent' ? 'bg-red-100 text-red-800'
                    : c.priority === 'high' ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-700'
                  }`}>{c.priority?.toUpperCase()}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.tenant_name} · {c.property_name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Opened: {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                <StatusBadge status={c.status} />
                <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                  Level {c.escalation_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => load(page - 1)} disabled={page === 1}
            className="px-4 py-1.5 border rounded-lg text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500 self-center">Page {page}</span>
          <button onClick={() => load(page + 1)} disabled={page * 20 >= total}
            className="px-4 py-1.5 border rounded-lg text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
