import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Modal } from '../../components/ui';
import { PageHeader, StatusBadge, ConfirmDialog } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Bell, Plus, Trash2, Calendar, Building2, Clock, Search, 
  AlertCircle, CheckCircle2, Megaphone
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function OwnerNotices() {
  const { user, token } = useAuth();
  const [notices, setNotices] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    property_id: '',
    title: '',
    body: '',
    expires_at: ''
  });

  // Delete Dialog State
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProperties = () => {
    fetch(`${API}/properties/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setProperties(list);
        if (list.length > 0 && !form.property_id) {
          setForm(f => ({ ...f, property_id: list[0].property_id }));
        }
      })
      .catch(() => {});
  };

  const loadNotices = () => {
    setLoading(true);
    let url = `${API}/notices?page_size=50`;
    if (selectedProperty) {
      url += `&property_id=${selectedProperty}`;
    }
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load notices');
        return res.json();
      })
      .then(d => {
        setNotices(d.notices || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProperties();
  }, [token]);

  useEffect(() => {
    loadNotices();
  }, [token, selectedProperty]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.property_id || !form.title.trim() || !form.body.trim()) {
      toast.error('Please fill in property, title, and message.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        property_id: form.property_id,
        title: form.title.trim(),
        body: form.body.trim(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null
      };

      const res = await fetch(`${API}/notices`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to broadcast notice');
      }

      toast.success('Notice published to all property residents!');
      setIsCreateOpen(false);
      setForm(f => ({
        property_id: properties[0]?.property_id || '',
        title: '',
        body: '',
        expires_at: ''
      }));
      loadNotices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!noticeToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/notices/${noticeToDelete.notice_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Could not delete notice');
      }

      toast.success('Notice removed successfully.');
      setNoticeToDelete(null);
      loadNotices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredNotices = notices.filter(n => {
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.body?.toLowerCase().includes(q) ||
      n.posted_by_name?.toLowerCase().includes(q)
    );
  });

  const getPropertyName = (propId) => {
    const prop = properties.find(p => p.property_id === propId);
    return prop ? prop.name : 'All Residents';
  };

  const isExpired = (expDate) => {
    if (!expDate) return false;
    return new Date(expDate) < new Date();
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <PageHeader 
          title="Announcements & Notices"
          subtitle="Broadcast important updates, curfew rules, or maintenance schedules to students."
          actions={
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="btn-cta flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Broadcast Notice</span>
            </button>
          }
        />

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center card p-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search notices by keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="field-input !h-10 !pl-10 w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)}
              className="field-input !h-10 text-sm font-medium"
              aria-label="Filter notices by property"
            >
              <option value="">All Properties</option>
              {properties.map(p => (
                <option key={p.property_id} value={p.property_id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notice List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState 
            icon={<Megaphone size={48} className="text-gray-300" />}
            title="No notices found"
            description={searchQuery ? "No notices match your search criteria." : "You haven't posted any notices yet. Create your first announcement to notify your residents."}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotices.map(notice => {
              const expired = isExpired(notice.expires_at);
              return (
                <Card 
                  key={notice.notice_id}
                  className="p-6 flex flex-col justify-between hover:shadow-float transition-all relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200">
                          <Building2 size={13} />
                          {getPropertyName(notice.property_id)}
                        </span>
                        {notice.expires_at && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                            expired 
                              ? 'bg-rose-50 text-rose-700 ring-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          }`}>
                            <Clock size={12} />
                            {expired ? 'Expired' : `Expires ${new Date(notice.expires_at).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setNoticeToDelete(notice)}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete notice"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 className="font-extrabold text-lg text-brand-navy leading-snug">
                      {notice.title}
                    </h3>

                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                      {notice.body}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Posted on {new Date(notice.posted_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>By {notice.posted_by_name || 'Management'}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Notice Modal */}
        <Modal 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Publish New Notice"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Target Property *
              </label>
              <select 
                value={form.property_id}
                onChange={e => setForm({ ...form, property_id: e.target.value })}
                className="field-input w-full"
                required
              >
                {properties.map(p => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Notice Title *
              </label>
              <input 
                type="text"
                placeholder="e.g., Scheduled Water Maintenance on Sunday"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                maxLength={100}
                className="field-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Message Body *
              </label>
              <textarea 
                rows={5}
                placeholder="Detail the announcement, timings, and any instructions for residents..."
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                maxLength={2000}
                className="field-input w-full !h-auto py-2.5 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Expiration Date (Optional)
              </label>
              <input 
                type="date"
                value={form.expires_at}
                onChange={e => setForm({ ...form, expires_at: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="field-input w-full"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Notice will automatically disappear from student feeds after this date.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cta !py-2.5"
                disabled={creating}
              >
                {creating ? 'Broadcasting...' : 'Publish Notice'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog 
          isOpen={Boolean(noticeToDelete)}
          onClose={() => setNoticeToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Notice?"
          description={`Are you sure you want to delete "${noticeToDelete?.title}"? Residents will no longer see this notice.`}
          confirmLabel="Delete Notice"
          tone="danger"
          loading={deleting}
        />

      </div>
    </PageTransition>
  );
}
