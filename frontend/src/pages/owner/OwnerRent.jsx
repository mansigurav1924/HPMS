import React, { useMemo } from 'react';
import { AlertCircle, Wallet, Users, Building2 } from 'lucide-react';
import { useApi, formatDate, formatINR } from '../../lib/api';
import {
  PageTransition, PageHeader, DataTable, StatusBadge, StatCard, EmptyState, Button, Card,
} from '../../components/ui';

/**
 * Rent roll: derived strictly from real tenancy records (rent_amount of active tenancies).
 * Payment collection is currently paused platform-wide, so no payment history is fabricated here.
 */
export default function OwnerRent() {
  const tenancies = useApi('/tenancies');
  const props = useApi('/properties/mine');

  const names = useMemo(() => {
    const m = {};
    (Array.isArray(props.data) ? props.data : []).forEach((p) => (m[p.property_id] = p.name));
    return m;
  }, [props.data]);

  const rows = useMemo(
    () => (tenancies.data?.tenancies || []).map((t) => ({ ...t, property_name: names[t.property_id] || '—' })),
    [tenancies.data, names]
  );
  const active = rows.filter((r) => r.status === 'active' || r.status === 'notice');
  const monthly = active.reduce((a, r) => a + (Number(r.rent) || 0), 0);

  const columns = [
    { key: 'property_name', header: 'Property', render: (t) => <span className="font-semibold text-gray-900">{t.property_name}</span> },
    { key: 'rent', header: 'Monthly rent', render: (t) => formatINR(t.rent) },
    { key: 'check_in_date', header: 'Since', render: (t) => formatDate(t.check_in_date) },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  if (tenancies.error)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load rent data"
          description={tenancies.error}
          action={<Button onClick={tenancies.reload}>Try again</Button>}
        />
      </PageTransition>
    );

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Rent & Ledger" subtitle="Monthly rent roll from your active tenancies." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard index={0} label="Expected monthly rent" value={monthly} prefix="₹" icon={<Wallet size={22} />} tone="emerald" />
          <StatCard index={1} label="Active tenancies" value={active.length} icon={<Users size={22} />} tone="indigo" />
          <StatCard index={2} label="Properties with tenants" value={new Set(active.map((a) => a.property_id)).size} icon={<Building2 size={22} />} tone="violet" />
        </div>
        <Card className="p-4 mb-6 text-sm text-gray-600 bg-primary-50/50 border-primary-100">
          Online payment collection is currently paused, so payment history is not shown. Figures above reflect agreed rent on tenancy records.
        </Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          loading={tenancies.loading}
          searchKeys={['property_name']}
          searchPlaceholder="Search by property…"
          emptyTitle="No tenancy records"
        />
      </div>
    </PageTransition>
  );
}
