import React, { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApi, formatDate, formatINR } from '../../lib/api';
import {
  PageTransition, PageHeader, DataTable, StatusBadge, PillSelect, EmptyState, Button,
} from '../../components/ui';

export default function OwnerTenants() {
  const tenancies = useApi('/tenancies');
  const props = useApi('/properties/mine');
  const [status, setStatus] = useState('');

  const names = useMemo(() => {
    const m = {};
    (Array.isArray(props.data) ? props.data : []).forEach((p) => (m[p.property_id] = p.name));
    return m;
  }, [props.data]);

  const rows = useMemo(
    () => (tenancies.data?.tenancies || []).map((t) => ({ ...t, property_name: names[t.property_id] || '—' })),
    [tenancies.data, names]
  );
  const statuses = [...new Set(rows.map((r) => r.status))];
  const visible = status ? rows.filter((r) => r.status === status) : rows;

  const columns = [
    { key: 'property_name', header: 'Property', render: (t) => <span className="font-semibold text-gray-900">{t.property_name}</span> },
    { key: 'bed_id', header: 'Bed', render: (t) => <span className="font-mono text-xs">{String(t.bed_id || '—').slice(0, 8)}</span> },
    { key: 'rent', header: 'Monthly rent', render: (t) => formatINR(t.rent) },
    { key: 'check_in_date', header: 'Check-in', render: (t) => formatDate(t.check_in_date) },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  if (tenancies.error)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load tenants"
          description={tenancies.error}
          action={<Button onClick={tenancies.reload}>Try again</Button>}
        />
      </PageTransition>
    );

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Tenants" subtitle="Everyone currently or previously staying at your properties." />
        <DataTable
          columns={columns}
          rows={visible}
          rowKey="id"
          loading={tenancies.loading}
          searchKeys={['property_name']}
          searchPlaceholder="Search by property…"
          emptyTitle="No tenants yet"
          emptyDescription="Tenancies appear here after you check a student in."
          filters={
            <PillSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{String(s).replace(/_/g, ' ')}</option>)}
            </PillSelect>
          }
        />
      </div>
    </PageTransition>
  );
}
