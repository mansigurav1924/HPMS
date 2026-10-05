import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../AuthContext';

const API = 'http://127.0.0.1:8000';

const CATEGORIES = [
  'Electrical','Plumbing','Cleaning','WiFi',
  'Furniture','Food','Security','Noise_Roommate','Other'
];
const PRIORITIES = ['low','medium','high','urgent'];

const STATUS_COLORS = {
  open:         'bg-blue-100 text-blue-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  in_progress:  'bg-orange-100 text-orange-800',
  resolved:     'bg-green-100 text-green-800',
  closed:       'bg-gray-200 text-gray-700',
  reopened:     'bg-purple-100 text-purple-800',
};

const PRIORITY_COLORS = {
  low:    'text-gray-500',
  medium: 'text-blue-600',
  high:   'text-orange-600',
  urgent: 'text-red-700 font-bold',
};

function StarRating({ onRate }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  const submit = (r) => {
    setSelected(r);
    onRate(r);
  };

  return (
    <div className="flex gap-1 mt-2">
      {[1,2,3,4,5].map(r => (
        <button
          key={r}
          onClick={() => submit(r)}
          onMouseEnter={() => setHovered(r)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition ${
            r <= (hovered || selected) ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >★</button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function Timeline({ updates }) {
  return (
    <ol className="relative border-l border-indigo-200 ml-3 mt-4">
      {updates.map(u => (
        <li key={u.update_id} className="mb-5 ml-5">
          <span className="absolute -left-2 w-4 h-4 bg-indigo-500 rounded-full ring-4 ring-white" />
          <p className="text-xs text-gray-400 mb-0.5">
            {new Date(u.created_at).toLocaleString()} · {u.author_name}
            {u.status_change && (
              <span className="ml-2 text-indigo-500 font-medium">→ {u.status_change}</span>
            )}
          </p>
          <p className="text-sm text-gray-700">{u.message}</p>
        </li>
      ))}
    </ol>
  );
}

function RaiseForm({ onSuccess, onCancel }) {
  const { token } = useAuth();
  const [form, setForm]   = useState({ category: '', description: '', priority: 'medium' });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/complaints`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to raise complaint');
      }
      const { complaint_id } = await res.json();

      // Upload photos
      for (const f of photos) {
        const fd = new FormData();
        fd.append('file', f);
        await fetch(`${API}/complaints/${complaint_id}/upload-photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previews = photos.map(f => URL.createObjectURL(f));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-indigo-700">Raise a Complaint</h2>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2">{error}</div>}

        <div>
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select value={form.category} onChange={set('category')} required
            className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
            <option value="">Select category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' / ')}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <select value={form.priority} onChange={set('priority')}
            className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none">
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={set('description')} required rows={4}
            placeholder="Describe the issue in detail…"
            className="mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none" />
        </div>

        {/* Photo previews */}
        <div>
          <label className="text-sm font-medium text-gray-700">Photos (max 5, optional)</label>
          <button type="button" onClick={() => fileRef.current.click()}
            className="mt-1 block w-full border-2 border-dashed border-indigo-300 rounded-lg py-3 text-sm text-indigo-500 hover:bg-indigo-50 transition">
            + Add Photos
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
            onChange={e => setPhotos(Array.from(e.target.files).slice(0, 5))} />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {previews.map((src, i) => (
                <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg border" />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
            {loading ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ComplaintDetail({ complaint, token, onClose, onRefresh }) {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [rating, setRating]   = useState(null);
  const [rateMsg, setRateMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/complaints/${complaint.complaint_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); });
  }, [complaint.complaint_id, token]);

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    await fetch(`${API}/complaints/${complaint.complaint_id}/updates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: comment, visibility: 'public' }),
    });
    setComment('');
    setPosting(false);
    // Refresh detail
    fetch(`${API}/complaints/${complaint.complaint_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setDetail);
  };

  const reopen = async () => {
    await fetch(`${API}/complaints/${complaint.complaint_id}/reopen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Issue not resolved' }),
    });
    onRefresh();
    onClose();
  };

  const submitRating = async (r) => {
    setRating(r);
    const res = await fetch(`${API}/complaints/${complaint.complaint_id}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: r }),
    });
    setRateMsg(res.ok ? 'Thank you for your rating!' : 'Already rated or error.');
  };

  const sla = detail?.complaint_sla || {};
  const reopenDays = sla?.reopen_window_days || 7;
  const resolvedAt = detail?.resolved_at ? new Date(detail.resolved_at) : null;
  const canReopen  = resolvedAt && (Date.now() - resolvedAt.getTime()) < reopenDays * 86400000
                     && detail?.status === 'resolved';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {detail.category?.replace('_', ' / ')}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {detail.property_name} · {new Date(detail.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4">{detail.description}</p>

            {/* Photos */}
            {detail.photos?.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {detail.photos.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border hover:opacity-80" />
                  </a>
                ))}
              </div>
            )}

            {/* Resolution notes */}
            {detail.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                <p className="text-sm text-gray-700">{detail.resolution_notes}</p>
              </div>
            )}

            {/* Timeline */}
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Activity Timeline</h3>
            {detail.updates?.length > 0
              ? <Timeline updates={detail.updates} />
              : <p className="text-xs text-gray-400 italic ml-3">No updates yet.</p>
            }

            {/* Comment box */}
            <div className="mt-4 flex gap-2">
              <input
                value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <button onClick={postComment} disabled={posting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {posting ? '…' : 'Send'}
              </button>
            </div>

            {/* Reopen button */}
            {canReopen && (
              <button onClick={reopen}
                className="mt-3 w-full py-2 border-2 border-orange-400 text-orange-600 text-sm font-semibold rounded-lg hover:bg-orange-50 transition">
                Reopen Complaint ({reopenDays}d window)
              </button>
            )}

            {/* Rating */}
            {['resolved','closed'].includes(detail.status) && !detail.student_rating && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800">Rate your experience</p>
                <StarRating onRate={submitRating} />
                {rateMsg && <p className="text-xs text-gray-500 mt-1">{rateMsg}</p>}
              </div>
            )}
            {detail.student_rating && (
              <p className="mt-2 text-xs text-gray-500">
                You rated this complaint: {'★'.repeat(detail.student_rating)}{'☆'.repeat(5 - detail.student_rating)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentComplaintsPage() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [selected,   setSelected]   = useState(null);

  const load = async (p = 1) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/complaints?page=${p}&page_size=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Complaints</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow transition">
          + Raise Complaint
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error} <button onClick={() => load()} className="underline ml-2">Retry</button>
        </div>
      )}

      {/* Skeleton loader */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
          ))}
        </div>
      )}

      {!loading && complaints.length === 0 && !error && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-medium">No complaints yet. Hope everything is great!</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {complaints.map(c => (
            <button
              key={c.complaint_id}
              onClick={() => setSelected(c)}
              className="w-full text-left bg-white rounded-xl shadow-sm border hover:border-indigo-300 hover:shadow-md transition p-4 flex justify-between items-start"
            >
              <div>
                <p className="font-semibold text-gray-800">{c.category?.replace('_', ' / ')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.property_name} · {new Date(c.created_at).toLocaleDateString()}</p>
                <p className={`text-xs mt-1 ${PRIORITY_COLORS[c.priority]}`}>
                  {c.priority?.toUpperCase()} priority
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={c.status} />
                {c.escalated && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    ⚠ Escalated
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => load(page - 1)} disabled={page === 1}
            className="px-4 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            ← Prev
          </button>
          <span className="text-sm text-gray-500 self-center">Page {page}</span>
          <button onClick={() => load(page + 1)} disabled={page * 10 >= total}
            className="px-4 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            Next →
          </button>
        </div>
      )}

      {showForm && (
        <RaiseForm onSuccess={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      )}
      {selected && (
        <ComplaintDetail
          complaint={selected}
          token={token}
          onClose={() => setSelected(null)}
          onRefresh={() => load(page)}
        />
      )}
    </div>
  );
}
