import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const API = 'http://127.0.0.1:8000';

const STATUS_COLORS = {
  open:         'bg-blue-100 text-blue-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  in_progress:  'bg-orange-100 text-orange-800',
  resolved:     'bg-green-100 text-green-800',
  closed:       'bg-gray-200 text-gray-700',
  reopened:     'bg-purple-100 text-purple-800',
};

const PRIORITY_BG = {
  low:    'border-l-gray-300',
  medium: 'border-l-blue-400',
  high:   'border-l-orange-500',
  urgent: 'border-l-red-600',
};

const TASK_STATUS_COLORS = {
  pending:     'bg-gray-100 text-gray-700',
  in_progress: 'bg-orange-100 text-orange-800',
  done:        'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
};

function StatusBadge({ status, map = STATUS_COLORS }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100'}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
}

// ─── Complaint Detail (with internal notes + controls) ───────────────────────
function ComplaintDetail({ complaint, token, onClose, onRefresh }) {
  const [detail,      setDetail]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [status,      setStatus]      = useState('');
  const [resNotes,    setResNotes]    = useState('');
  const [comment,     setComment]     = useState('');
  const [visibility,  setVisibility]  = useState('public');
  const [submitting,  setSubmitting]  = useState(false);
  const [proofFile,   setProofFile]   = useState(null);
  const [msg,         setMsg]         = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API}/complaints/${complaint.complaint_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { setDetail(d); setLoading(false); });
  };

  useEffect(load, [complaint.complaint_id]);

  const changeStatus = async () => {
    if (!status) return;
    setSubmitting(true);
    const res = await fetch(`${API}/complaints/${complaint.complaint_id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution_notes: resNotes || undefined }),
    });
    const d = await res.json();
    setMsg(res.ok ? 'Status updated' : d.detail || 'Error');
    setSubmitting(false);
    load(); onRefresh();
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await fetch(`${API}/complaints/${complaint.complaint_id}/updates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: comment, visibility }),
    });
    setComment(''); setSubmitting(false); load();
  };

  const uploadProof = async () => {
    if (!proofFile) return;
    setSubmitting(true);
    const fd = new FormData(); fd.append('file', proofFile);
    const res = await fetch(`${API}/complaints/${complaint.complaint_id}/upload-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    setMsg(res.ok ? 'Proof uploaded' : 'Upload failed');
    setSubmitting(false); load();
  };

  // SLA countdown
  const slaHours = { low: 120, medium: 72, high: 48, urgent: 24 };
  const getSlaStatus = (c) => {
    if (!c) return null;
    const hours = slaHours[c.priority] || 72;
    const created = new Date(c.created_at);
    const deadline = new Date(created.getTime() + hours * 3600000);
    const msLeft = deadline - Date.now();
    if (msLeft < 0) return { label: 'SLA BREACHED', color: 'text-red-600 font-bold', breached: true };
    const hLeft = Math.floor(msLeft / 3600000);
    return { label: `SLA: ${hLeft}h left`, color: hLeft < 6 ? 'text-orange-500 font-semibold' : 'text-gray-500', breached: false };
  };

  const slaStatus = getSlaStatus(detail);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {loading ? '…' : detail?.category?.replace('_', ' / ')}
            </h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {detail?.tenant_name} · {detail?.property_name} ·{' '}
                {new Date(detail?.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!loading && <StatusBadge status={detail?.status} />}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-5 bg-gray-200 rounded" />)}
          </div>
        ) : (
          <>
            {/* SLA + escalation info */}
            <div className="flex gap-4 text-xs mb-3">
              <span className={slaStatus?.color}>{slaStatus?.label}</span>
              {detail.escalated && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                  ⚠ Escalated L{detail.escalation_level}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-4">{detail.description}</p>

            {/* Photos */}
            {detail.photos?.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {detail.photos.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                  </a>
                ))}
              </div>
            )}

            {/* Resolution proof */}
            {detail.resolution_proof?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-1">Resolution Proof</p>
                <div className="flex gap-2 flex-wrap">
                  {detail.resolution_proof.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Update thread with internal notes marked */}
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Activity Thread</h3>
            <ol className="relative border-l border-indigo-200 ml-3 mb-4 max-h-56 overflow-y-auto">
              {detail.updates?.map(u => (
                <li key={u.update_id} className="mb-4 ml-5">
                  <span className={`absolute -left-2 w-4 h-4 rounded-full ring-4 ring-white ${
                    u.visibility === 'internal' ? 'bg-yellow-400' : 'bg-indigo-500'
                  }`} />
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleString()} · {u.author_name}
                    </p>
                    {u.visibility === 'internal' && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded font-semibold">
                        INTERNAL
                      </span>
                    )}
                    {u.status_change && (
                      <span className="text-xs text-indigo-600 font-medium">→ {u.status_change}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{u.message}</p>
                </li>
              ))}
            </ol>

            {/* Status change control */}
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Change Status</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {['acknowledged','in_progress','resolved','closed'].map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
                      status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                    }`}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {status === 'resolved' && (
                <textarea value={resNotes} onChange={e => setResNotes(e.target.value)}
                  placeholder="Resolution notes (required)…" rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-indigo-400 outline-none resize-none" />
              )}
              {msg && <p className="text-xs text-indigo-600 mt-1">{msg}</p>}
              <button onClick={changeStatus} disabled={!status || submitting}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                {submitting ? '…' : 'Apply'}
              </button>
            </div>

            {/* Resolution proof upload */}
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Upload Resolution Proof</p>
              <div className="flex gap-2">
                <input type="file" accept="image/*" onChange={e => setProofFile(e.target.files[0])}
                  className="text-sm flex-1" />
                <button onClick={uploadProof} disabled={!proofFile || submitting}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-40">
                  Upload
                </button>
              </div>
            </div>

            {/* Comment box */}
            <div className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
              <select value={visibility} onChange={e => setVisibility(e.target.value)}
                className="border rounded-lg px-2 text-xs text-gray-600">
                <option value="public">Public</option>
                <option value="internal">Internal</option>
              </select>
              <button onClick={postComment} disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                {submitting ? '…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Maintenance Task Form ────────────────────────────────────────────────────
function MaintenanceForm({ properties, token, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    property_id: '', room_id: '', bed_id: '', title: '',
    description: '', vendor_name: '', cost: '', scheduled_on: '',
    blocks_availability: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({
    ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.cost) delete payload.cost;
      if (!payload.room_id) delete payload.room_id;
      if (!payload.bed_id) delete payload.bed_id;
      const res = await fetch(`${API}/maintenance-tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Failed');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-indigo-700">New Maintenance Task</h2>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2">{error}</div>}

        <select value={form.property_id} onChange={set('property_id')} required
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Select property…</option>
          {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.name}</option>)}
        </select>

        <input value={form.room_id} onChange={set('room_id')}
          placeholder="Room ID (optional)" className="border rounded-lg px-3 py-2 text-sm" />
        <input value={form.bed_id} onChange={set('bed_id')}
          placeholder="Bed ID (optional)" className="border rounded-lg px-3 py-2 text-sm" />
        <input value={form.title} onChange={set('title')} required
          placeholder="Title" className="border rounded-lg px-3 py-2 text-sm" />
        <textarea value={form.description} onChange={set('description')} rows={3}
          placeholder="Description" className="border rounded-lg px-3 py-2 text-sm resize-none" />
        <input value={form.vendor_name} onChange={set('vendor_name')}
          placeholder="Vendor / Contractor name" className="border rounded-lg px-3 py-2 text-sm" />
        <input value={form.cost} onChange={set('cost')} type="number" step="0.01"
          placeholder="Estimated cost (₹)" className="border rounded-lg px-3 py-2 text-sm" />
        <input value={form.scheduled_on} onChange={set('scheduled_on')} type="datetime-local"
          className="border rounded-lg px-3 py-2 text-sm" />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.blocks_availability} onChange={set('blocks_availability')} />
          Block bed availability while task is active
          {form.blocks_availability && form.bed_id && (
            <span className="text-xs text-orange-600 font-semibold ml-1">
              ⚠ Will fail if bed is occupied
            </span>
          )}
        </label>

        <div className="flex gap-3 justify-end mt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OwnerComplaintsPage() {
  const { token, user } = useAuth();
  const [tab,         setTab]         = useState('complaints');
  const [complaints,  setComplaints]  = useState([]);
  const [tasks,       setTasks]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [taskTotal,   setTaskTotal]   = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [selected,    setSelected]    = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [properties,  setProperties]  = useState([]);

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterEscalated, setFilterEscalated] = useState(false);
  const [taskStatus,     setTaskStatus]     = useState('');

  const loadComplaints = async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page_size: 20 });
    if (filterStatus)   params.append('status', filterStatus);
    if (filterPriority) params.append('priority', filterPriority);
    if (filterEscalated) params.append('escalated', 'true');
    try {
      const res = await fetch(`${API}/complaints?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setComplaints(d.complaints || []); setTotal(d.total || 0);
    } catch { setError('Failed to load complaints'); }
    setLoading(false);
  };

  const loadTasks = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page_size: 20 });
    if (taskStatus) params.append('status', taskStatus);
    try {
      const res = await fetch(`${API}/maintenance-tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setTasks(d.tasks || []); setTaskTotal(d.total || 0);
    } catch { setError('Failed to load tasks'); }
    setLoading(false);
  };

  const loadProperties = async () => {
    const res = await fetch(`${API}/properties/my`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setProperties(d.properties || []); }
  };

  useEffect(() => {
    loadProperties();
    if (tab === 'complaints') loadComplaints();
    else loadTasks();
  }, [tab, filterStatus, filterPriority, filterEscalated, taskStatus]);

  const updateTaskStatus = async (task_id, status) => {
    await fetch(`${API}/maintenance-tasks/${task_id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadTasks();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Complaints & Maintenance</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {['complaints','maintenance'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition ${
              tab === t ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── COMPLAINTS TAB ── */}
      {tab === 'complaints' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700">
              <option value="">All statuses</option>
              {['open','acknowledged','in_progress','resolved','closed','reopened'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700">
              <option value="">All priorities</option>
              {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700 border rounded-lg px-3 py-1.5 cursor-pointer">
              <input type="checkbox" checked={filterEscalated}
                onChange={e => setFilterEscalated(e.target.checked)} />
              Escalated only
            </label>
            <span className="text-xs text-gray-400 self-center">{total} complaints</span>
          </div>

          {error && <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />)}
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">✅</p>
              <p>No complaints match the filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <button key={c.complaint_id} onClick={() => setSelected(c)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm border-l-4 hover:shadow-md transition p-4 flex justify-between items-start ${PRIORITY_BG[c.priority] || 'border-l-gray-300'}`}>
                  <div>
                    <p className="font-semibold text-gray-800">{c.category?.replace('_', ' / ')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.tenant_name} · {c.property_name} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 italic truncate max-w-xs">{c.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                    <StatusBadge status={c.status} />
                    {c.escalated && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        ⚠ L{c.escalation_level}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${
                      c.priority === 'urgent' ? 'text-red-600'
                      : c.priority === 'high' ? 'text-orange-500'
                      : 'text-gray-500'
                    }`}>{c.priority}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MAINTENANCE TAB ── */}
      {tab === 'maintenance' && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm text-gray-700">
              <option value="">All statuses</option>
              {['pending','in_progress','done','cancelled'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ')}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 self-center">{taskTotal} tasks</span>
            <button onClick={() => setShowTaskForm(true)}
              className="ml-auto px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">
              + New Task
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🔧</p><p>No maintenance tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(t => (
                <div key={t.task_id} className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.property_name}</p>
                    {t.vendor_name && <p className="text-xs text-gray-500 mt-0.5">Vendor: {t.vendor_name}</p>}
                    {t.cost != null && (
                      <p className="text-xs text-gray-500 mt-0.5">Cost: ₹{t.cost}</p>
                    )}
                    {t.blocks_availability && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 rounded font-medium mt-1 inline-block">
                        Blocks bed
                      </span>
                    )}
                    {t.scheduled_on && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Scheduled: {new Date(t.scheduled_on).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={t.status} map={TASK_STATUS_COLORS} />
                    {t.status !== 'done' && t.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        {t.status === 'pending' && (
                          <button onClick={() => updateTaskStatus(t.task_id, 'in_progress')}
                            className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                            Start
                          </button>
                        )}
                        {t.status === 'in_progress' && (
                          <button onClick={() => updateTaskStatus(t.task_id, 'done')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                            Mark Done
                          </button>
                        )}
                        <button onClick={() => updateTaskStatus(t.task_id, 'cancelled')}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selected && (
        <ComplaintDetail
          complaint={selected}
          token={token}
          onClose={() => setSelected(null)}
          onRefresh={() => tab === 'complaints' ? loadComplaints() : loadTasks()}
        />
      )}
      {showTaskForm && (
        <MaintenanceForm
          properties={properties}
          token={token}
          onSuccess={() => { setShowTaskForm(false); loadTasks(); }}
          onCancel={() => setShowTaskForm(false)}
        />
      )}
    </div>
  );
}
