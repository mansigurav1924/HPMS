import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Popover } from '../ui';
import { useAuth } from '../../AuthContext';
import { apiFetch, formatDate } from '../../lib/api';

/** Live notification bell backed by GET /notifications. */
export default function NotificationBell({ align = 'right' }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch('/notifications?page_size=6', token)
      .then((d) => {
        setItems(d?.notifications || []);
        setUnread(d?.unread_count || 0);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const markAll = async () => {
    try {
      await apiFetch('/notifications/read-all', token, { method: 'POST' });
      load();
    } catch {
      /* non-critical */
    }
  };

  return (
    <Popover
      align={align}
      isOpen={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          className="btn-light-circle relative"
          onClick={() => {
            setOpen((o) => !o);
            if (!open) load();
          }}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          aria-expanded={open}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      }
    >
      <div className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="font-bold text-brand-navy text-sm">Notifications</p>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">You're all caught up.</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`px-4 py-3 text-sm ${n.read_at ? '' : 'bg-primary-50/50'}`}>
                <p className="font-semibold text-gray-800 line-clamp-1">{n.title || n.subject || 'Notification'}</p>
                <p className="text-gray-500 text-xs line-clamp-2 mt-0.5">{n.body || n.message || ''}</p>
                <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Popover>
  );
}
