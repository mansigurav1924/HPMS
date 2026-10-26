import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarDays, MapPin, FileCheck2, Search } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useApi, apiFetch, formatDate } from '../../lib/api';
import {
  PageTransition, PageHeader, Card, StatusBadge, ConfirmDialog, EmptyState, Button, Skeleton, toast,
} from '../../components/ui';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress', statuses: ['requested', 'approved', 'payment_pending'] },
  { key: 'confirmed', label: 'Confirmed', statuses: ['confirmed', 'checked_in'] },
  { key: 'closed', label: 'Closed', statuses: ['rejected', 'cancelled', 'expired', 'no_show'] },
];
const CANCELLABLE = ['requested', 'approved', 'payment_pending', 'confirmed'];

export default function BookingsPage() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useApi('/bookings?page_size=100');
  const [tab, setTab] = useState('all');
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const bookings = useMemo(() => data?.bookings || [], [data]);
  const visible = useMemo(() => {
    const t = TABS.find((x) => x.key === tab);
    return t?.statuses ? bookings.filter((b) => t.statuses.includes(b.status)) : bookings;
  }, [bookings, tab]);

  const cancel = async () => {
    setBusy(true);
    try {
      await apiFetch(`/bookings/${target.booking_id}/cancel`, token, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() || 'Cancelled by student' }),
      });
      toast.success('Booking cancelled');
      setTarget(null);
      setReason('');
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load your bookings"
          description={error}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </PageTransition>
    );

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader
          title="My Bookings"
          subtitle="Track your requests, approvals and confirmed stays."
          actions={
            <Link to="/search" className="btn-cta !py-2.5 text-sm">
              <Search size={16} /> Find a hostel
            </Link>
          }
        />

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t.key ? 'text-white' : 'text-gray-600 bg-white border border-gray-200 hover:border-primary-200'
              }`}
            >
              {tab === t.key && (
                <motion.span layoutId="booking-tab" className="absolute inset-0 rounded-full bg-brand-gradient shadow-glow" transition={{ duration: 0.25 }} />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileCheck2 size={44} className="text-gray-300" />}
              title="No bookings here"
              description="When you request or book a hostel, it will show up in this list."
              action={<Link to="/search" className="btn-cta">Explore hostels</Link>}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {visible.map((b, i) => (
              <motion.div
                key={b.booking_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.25 }}
              >
                <Card className="p-5 card-hover">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <Link to={`/properties/${b.property_id}`} className="text-lg font-bold text-brand-navy hover:text-primary-600 transition-colors truncate">
                          {b.property_name}
                        </Link>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin size={14} /> {[b.address, b.city].filter(Boolean).join(', ')}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-primary-500" /> Requested {formatDate(b.requested_at || b.created_at)}</span>
                        {b.move_in_date && <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-primary-500" /> Move-in {formatDate(b.move_in_date)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/properties/${b.property_id}`} className="btn-secondary text-sm">View property</Link>
                      {CANCELLABLE.includes(b.status) && (
                        <button
                          onClick={() => setTarget(b)}
                          className="px-4 py-2.5 rounded-full text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(target)}
        onClose={() => { setTarget(null); setReason(''); }}
        onConfirm={cancel}
        loading={busy}
        tone="danger"
        title="Cancel this booking?"
        description={target ? `Your booking at ${target.property_name} will be cancelled.` : ''}
        confirmLabel="Yes, cancel booking"
      >
        <label htmlFor="cancel-reason" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason (optional)</label>
        <textarea id="cancel-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="field-input !h-auto py-3" />
      </ConfirmDialog>
    </PageTransition>
  );
}
