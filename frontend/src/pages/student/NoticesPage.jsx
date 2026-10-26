import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Bell, Building2, Calendar, Clock, CheckCircle2, 
  Megaphone, AlertCircle, Info, Sparkles
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function NoticesPage() {
  const { token } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotices = () => {
    setLoading(true);
    fetch(`${API}/notices`, {
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
    loadNotices();
  }, [token]);

  const markRead = async (noticeId) => {
    try {
      await fetch(`${API}/notices/${noticeId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(prev => prev.map(n => n.notice_id === noticeId ? { ...n, is_read: true } : n));
    } catch {}
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Hostel Announcements & Notices"
          subtitle="Official notices, maintenance schedules, and warden announcements for your residence."
        />

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState 
            icon={<AlertCircle size={48} className="text-rose-500" />}
            title="Unable to load notices"
            description={error}
          />
        ) : notices.length === 0 ? (
          <EmptyState 
            icon={<Megaphone size={48} className="text-gray-300" />}
            title="All Clear — No Active Notices"
            description="You don't have any unread or pending announcements from your hostel owner or warden."
          />
        ) : (
          <div className="space-y-4">
            {notices.map(notice => {
              const isUnread = !notice.is_read;
              return (
                <Card 
                  key={notice.notice_id}
                  className={`p-6 transition-all hover:shadow-float relative overflow-hidden ${
                    isUnread ? 'border-l-4 border-l-primary-500 bg-primary-50/20' : ''
                  }`}
                  onClick={() => isUnread && markRead(notice.notice_id)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200">
                        <Building2 size={13} />
                        {notice.posted_by_name ? `From ${notice.posted_by_name}` : 'Management'}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-primary-500 text-white shadow-sm">
                          New
                        </span>
                      )}
                      {notice.expires_at && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          Valid until {new Date(notice.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(notice.posted_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-brand-navy text-lg mb-2">
                    {notice.title}
                  </h3>

                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {notice.body}
                  </p>

                  {isUnread && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(notice.notice_id);
                        }}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Mark as acknowledged
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </PageTransition>
  );
}
