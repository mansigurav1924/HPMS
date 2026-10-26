import React, { useMemo, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useApi, apiFetch, formatDate } from '../../lib/api';
import {
  PageTransition, PageHeader, DataTable, StatusBadge, Avatar, ConfirmDialog, PillSelect, EmptyState, Button, toast,
} from '../../components/ui';

export default function OwnerBookings() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useApi('/bookings?page_size=100');
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState(null); // { booking, approve }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => data?.bookings || [], [data]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))], [rows]);
  const visible = status ? rows.filter((r) => r.status === status) : rows;
  const pending = rows.filter((r) => r.status === 'requested').length;

  const close = () => {
    setTarget(null);
    setReason('');
  };

  const submit = async () => {
    if (!target.approve && !reason.trim()) {
      toast.warning('Please give a reason for rejecting.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/bookings/${target.booking.booking_id}/respond`, token, {
        method: 'POST',
        body: JSON.stringify({ approve: target.approve, reason: reason.trim() || null }),
      });
      toast.success(target.approve ? 'Booking approved' : 'Booking rejected');
      close();
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'student_name',
      header: 'Student',
      render: (b) => (
        <div className="flex items-center gap-3">
          <Avatar name={b.student_name} size={34} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{b.student_name}</p>
            <p className="text-xs text-gray-500 truncate">{b.student_phone || b.student_email}</p>
          </div>
        </div>
      ),
    },
    { key: 'property_name', header: 'Property' },
    { key: 'requested_at', header: 'Requested', render: (b) => formatDate(b.requested_at || b.created_at) },
    { key: 'move_in_date', header: 'Move-in', render: (b) => formatDate(b.move_in_date) },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) =>
        b.status === 'requested' ? (
          <div className="flex gap-2">
            <button
              onClick={() => setTarget({ booking: b, approve: true })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={() => setTarget({ booking: b, approve: false })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <X size={14} /> Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  if (error)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load bookings"
          description={error}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </PageTransition>
    );

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Booking Requests"
          subtitle={pending ? `${pending} request${pending > 1 ? 's' : ''} waiting for your response.` : 'All caught up — no pending requests.'}
        />
        <DataTable
          columns={columns}
          rows={visible}
          rowKey="booking_id"
          loading={loading}
          searchKeys={['student_name', 'student_email', 'property_name']}
          searchPlaceholder="Search student or property…"
          emptyTitle="No bookings yet"
          emptyDescription="Booking requests for your properties will appear here."
          filters={
            <PillSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{String(s).replace(/_/g, ' ')}</option>
              ))}
            </PillSelect>
          }
        />
      </div>

      <ConfirmDialog
        isOpen={Boolean(target)}
        onClose={close}
        onConfirm={submit}
        loading={busy}
        tone={target?.approve ? 'primary' : 'danger'}
        title={target?.approve ? 'Approve booking?' : 'Reject booking?'}
        description={target ? `${target.booking.student_name} · ${target.booking.property_name}. The student will be notified.` : ''}
        confirmLabel={target?.approve ? 'Approve' : 'Reject'}
      >
        <label htmlFor="resp-reason" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          {target?.approve ? 'Note (optional)' : 'Reason (required)'}
        </label>
        <textarea id="resp-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="field-input !h-auto py-3" />
      </ConfirmDialog>
    </PageTransition>
  );
}
