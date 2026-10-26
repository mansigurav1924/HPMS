import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Bell, CheckCheck, Clock, CheckCircle2, MessageSquare, 
  ShieldCheck, AlertCircle, Sparkles, Inbox
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    fetch(`${API}/notifications?page_size=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load notifications');
        return res.json();
      })
      .then(d => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unread_count || 0);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const markAsRead = async (notifId) => {
    try {
      await fetch(`${API}/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch(`${API}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read.');
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Notifications & Activity Feed"
          subtitle={unreadCount > 0 ? `You have ${unreadCount} unread update${unreadCount > 1 ? 's' : ''}.` : 'Stay informed about booking updates, rent notices, and maintenance.'}
          actions={
            unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="btn-secondary flex items-center gap-2 !py-2.5 !text-xs font-bold"
              >
                <CheckCheck size={16} />
                <span>{markingAll ? 'Updating...' : 'Mark All as Read'}</span>
              </button>
            )
          }
        />

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState 
            icon={<AlertCircle size={48} className="text-rose-500" />}
            title="Failed to load notifications"
            description={error}
          />
        ) : notifications.length === 0 ? (
          <EmptyState 
            icon={<Inbox size={48} className="text-gray-300" />}
            title="No Notifications Yet"
            description="When your booking is approved, notices are posted, or complaints updated, they will appear here."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => {
              const isUnread = !notif.read_at;
              return (
                <div
                  key={notif.id}
                  onClick={() => isUnread && markAsRead(notif.id)}
                  className={`card p-4 flex items-start gap-4 transition-all cursor-pointer hover:shadow-float ${
                    isUnread ? 'bg-primary-50/30 border-l-4 border-l-primary-500' : 'bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Bell size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`text-sm tracking-tight truncate pr-2 ${
                        isUnread ? 'font-extrabold text-brand-navy' : 'font-semibold text-gray-700'
                      }`}>
                        {notif.title}
                      </h4>
                      <span className="text-[11px] text-gray-400 shrink-0 font-medium">
                        {new Date(notif.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 self-center" />
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </PageTransition>
  );
}
