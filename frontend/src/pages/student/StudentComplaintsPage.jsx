import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Plus, ChevronRight, X, Clock, MessageSquare, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button, Card, Badge, PageTransition, StaggerList, Skeleton, EmptyState, Modal } from '../../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = ['Electrical','Plumbing','Cleaning','WiFi','Furniture','Food','Security','Noise_Roommate','Other'];
const PRIORITIES = ['low','medium','high','urgent'];

const STATUS_COLORS = {
  open:         'bg-blue-100 text-blue-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  in_progress:  'bg-brand-orange/20 text-brand-orange',
  resolved:     'bg-green-100 text-green-800',
  closed:       'bg-gray-200 text-gray-700',
  reopened:     'bg-brand-purple/20 text-brand-purple',
};

const PRIORITY_COLORS = {
  low:    'text-gray-500',
  medium: 'text-brand-sky',
  high:   'text-brand-orange',
  urgent: 'text-red-600 font-extrabold',
};

function StatusBadge({ status }) {
  return (
    <Badge className={STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}>
      {status?.replace('_', ' ')}
    </Badge>
  );
}

function RaiseForm({ onSuccess, onCancel, token }) {
  const [form, setForm] = useState({ category: '', description: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title="Raise a Complaint">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4 font-semibold">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="pill-select w-full">
            <option value="">Select category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' / ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Priority</label>
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="pill-select w-full">
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required rows={4}
            placeholder="Describe the issue in detail…" className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-sky resize-none" />
        </div>
        <div className="flex gap-3 mt-4">
          <Button type="button" variant="light-circle" className="w-full !rounded-full !h-12 border border-gray-200" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Submitting…' : 'Submit'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ComplaintDetail({ complaint, token, onClose, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`${API}/complaints/${complaint.complaint_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setDetail(d); setLoading(false); });
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
    fetch(`${API}/complaints/${complaint.complaint_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setDetail);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      {loading ? (
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="flex flex-col h-full max-h-[70vh]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-brand-navy">{detail.category?.replace('_', ' / ')}</h2>
              <p className="text-xs font-semibold text-gray-400 mt-1">{detail.property_name} · {new Date(detail.created_at).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={detail.status} />
          </div>

          <div className="overflow-y-auto no-scrollbar flex-1 pr-2">
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-sm text-gray-700 leading-relaxed">
              {detail.description}
            </div>

            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
            <div className="space-y-4 mb-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {detail.updates?.length > 0 ? detail.updates.map(u => (
                <div key={u.update_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-brand-sky text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    {u.status_change ? <ShieldAlert size={14}/> : <MessageSquare size={14}/>}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white shadow-soft border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-brand-navy text-xs">{u.author_name}</span>
                      <time className="text-[10px] text-gray-400 font-medium">{new Date(u.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                    </div>
                    {u.status_change && <div className="text-[10px] font-bold text-brand-orange uppercase mb-1">Status → {u.status_change}</div>}
                    <p className="text-sm text-gray-600">{u.message}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-400 italic">No updates yet.</p>}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 shrink-0">
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Type a message…" className="flex-1 pill-input !py-2" />
            <Button onClick={postComment} disabled={posting} className="!px-6 !py-2">Send</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function StudentComplaintsPage() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/complaints?page=${p}&page_size=10`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {} 
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">My Complaints</h1>
            <p className="text-gray-500 font-medium mt-1">Track and manage your service requests</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 shrink-0">
            <Plus size={18} /> Raise Complaint
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState icon={<AlertCircle size={48} className="text-brand-sky opacity-50"/>} title="No complaints yet" description="Everything looks good! If you face any issues, you can raise a complaint here." />
        ) : (
          <StaggerList className="space-y-4">
            {complaints.map(c => (
              <Card key={c.complaint_id} className="p-0 group cursor-pointer hover:-translate-y-1 hover:shadow-float transition-all duration-300 border-l-4 border-l-brand-orange" onClick={() => setSelected(c)}>
                <div className="p-5 flex items-center justify-between">
                  <div className="flex gap-5 items-center">
                    <div className="hidden sm:flex w-12 h-12 rounded-full bg-brand-page items-center justify-center text-brand-navy border border-gray-100">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-extrabold text-brand-navy text-lg">{c.category?.replace('_', ' / ')}</h3>
                        {c.escalated && <Badge className="bg-red-100 text-red-600 border border-red-200 shadow-sm"><AlertTriangle size={10} className="mr-1 inline"/> Escalated</Badge>}
                      </div>
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {new Date(c.created_at).toLocaleDateString()} <span className="mx-1">•</span> 
                        <span className={`uppercase font-bold tracking-wider ${PRIORITY_COLORS[c.priority]}`}>{c.priority} priority</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={c.status} />
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-brand-orange transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </StaggerList>
        )}

        {showForm && <RaiseForm token={token} onSuccess={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}
        {selected && <ComplaintDetail complaint={selected} token={token} onClose={() => setSelected(null)} onRefresh={() => load(page)} />}
      </div>
    </PageTransition>
  );
}
