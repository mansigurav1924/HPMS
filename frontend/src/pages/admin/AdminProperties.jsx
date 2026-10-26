import React, { useMemo, useState } from 'react';
import { Check, X, Ban, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useApi, apiFetch, formatDate } from '../../lib/api';
import {
  PageTransition, PageHeader, DataTable, StatusBadge, ConfirmDialog, PillSelect, EmptyState, Button, toast,
} from '../../components/ui';

const ACTIONS = {
  approve: { label: 'Approve', title: 'Approve property?', tone: 'primary', needsReason: false },
  reject: { label: 'Reject', title: 'Reject property?', tone: 'danger', needsReason: true },
  suspend: { label: 'Suspend', title: 'Suspend property?', tone: 'danger', needsReason: true },
};

export default function AdminProperties() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useApi('/admin/properties');
  const [status, setStatus] = useState('');
  const [target, setTarget] = useState(null); // { property, action }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status).filter(Boolean))], [rows]);
  const visible = status ? rows.filter((r) => r.status === status) : rows;

  const close = () => {
    setTarget(null);
    setReason('');
  };

  const submit = async () => {
    const meta = ACTIONS[target.action];
    if (meta.needsReason && !reason.trim()) {
      toast.warning('Please provide a reason.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/admin/properties/${target.property.property_id}/verify`, token, {
        method: 'POST',
        body: JSON.stringify({ action: target.action, reason: reason.trim() || null }),
      });
      toast.success(`${target.property.name}: ${meta.label.toLowerCase()}d`);
      close();
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const canApprove = (s) => !['Approved'].includes(s);
  const canReject = (s) => !['Rejected', 'Suspended'].includes(s);
  const canSuspend = (s) => s === 'Approved';

  const columns = [
    {
      key: 'name',
      header: 'Property',
      render: (p) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{p.name}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
            <MapPin size={12} /> {p.city}
          </p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (p) => <span className="capitalize">{String(p.type || '—').replace(/_/g, ' ')}</span> },
    {
      key: 'owner_name',
      header: 'Owner',
      render: (p) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">{p.owner_name}</p>
          <p className="text-xs text-gray-500 truncate">{p.owner_email}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'created_at', header: 'Listed', render: (p) => formatDate(p.created_at) },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex gap-2 flex-wrap">
          {canApprove(p.status) && (
            <button
              onClick={() => setTarget({ property: p, action: 'approve' })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              <Check size={14} /> Approve
            </button>
          )}
          {canReject(p.status) && (
            <button
              onClick={() => setTarget({ property: p, action: 'reject' })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <X size={14} /> Reject
            </button>
          )}
          {canSuspend(p.status) && (
            <button
              onClick={() => setTarget({ property: p, action: 'suspend' })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Ban size={14} /> Suspend
            </button>
          )}
        </div>
      ),
    },
  ];

  if (error)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load properties"
          description={error}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </PageTransition>
    );

  const meta = target ? ACTIONS[target.action] : null;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Property Verification" subtitle="Review, approve, reject or suspend listings." />
        <DataTable
          columns={columns}
          rows={visible}
          rowKey="property_id"
          loading={loading}
          searchKeys={['name', 'city', 'owner_name', 'owner_email']}
          searchPlaceholder="Search property, city or owner…"
          emptyTitle="No properties found"
          filters={
            <PillSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
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
        tone={meta?.tone}
        title={meta?.title}
        description={target ? `${target.property.name} — ${target.property.city}. The owner will be notified.` : ''}
        confirmLabel={meta?.label}
      >
        {meta?.needsReason && (
          <div>
            <label htmlFor="reason" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Reason (required)
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field-input !h-auto py-3"
              placeholder="Explain the decision to the owner…"
            />
          </div>
        )}
      </ConfirmDialog>
    </PageTransition>
  );
}
