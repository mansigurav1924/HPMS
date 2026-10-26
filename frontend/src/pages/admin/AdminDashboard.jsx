import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, Building2, FileCheck2, ShieldCheck, AlertCircle, Star, RefreshCw, ArrowRight, ScrollText,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useApi, apiFetch, formatDate } from '../../lib/api';
import {
  PageTransition, PageHeader, StatCard, Card, Button, PageSkeleton, EmptyState, StatusBadge, toast,
} from '../../components/ui';
import { ChartCard, SimpleBarChart, DonutChart, objectToRows } from '../../components/charts';

const sum = (obj = {}) => Object.values(obj || {}).reduce((a, b) => a + (Number(b) || 0), 0);

export default function AdminDashboard() {
  const { token } = useAuth();
  const stats = useApi('/dashboard/admin');
  const audit = useApi('/admin/audit-logs?page_size=6');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await apiFetch('/dashboard/refresh', token, { method: 'POST' });
      stats.reload();
      toast.success('Dashboard statistics refreshed');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (stats.loading && !stats.data) return <PageTransition><PageSkeleton /></PageTransition>;
  if (stats.error)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load the dashboard"
          description={stats.error}
          action={<Button onClick={stats.reload}>Try again</Button>}
        />
      </PageTransition>
    );

  const d = stats.data?.data || {};
  const roles = d.users_by_role || {};
  const props = d.properties_by_status || {};
  const bookings = d.bookings_by_status || {};
  const supplyDemand = Object.entries(d.city_supply_demand || {}).map(([city, v]) => ({
    name: city, supply: v.supply, demand: v.demand,
  }));

  const queues = [
    { label: 'Owner verifications', value: d.pending_owner_verifications, to: '/admin/owners', icon: <ShieldCheck size={18} /> },
    { label: 'Property approvals', value: d.pending_property_verifications, to: '/admin/properties', icon: <Building2 size={18} /> },
    { label: 'Escalated complaints', value: d.escalated_complaints, to: '/admin/escalated', icon: <AlertCircle size={18} /> },
    { label: 'Flagged reviews', value: d.flagged_reviews, to: '/admin/reviews', icon: <Star size={18} /> },
  ];

  const logs = audit.data?.logs || [];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Platform health, approvals and activity at a glance."
          actions={
            <Button variant="secondary" onClick={refresh} loading={refreshing}>
              <RefreshCw size={16} className={refreshing ? 'hidden' : ''} /> Refresh stats
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">
          <StatCard index={0} label="Total users" value={sum(roles)} icon={<Users size={22} />} tone="indigo" />
          <StatCard index={1} label="Students" value={Number(roles.student) || 0} icon={<GraduationCap size={22} />} tone="sky" />
          <StatCard index={2} label="Owners" value={Number(roles.owner) || 0} icon={<ShieldCheck size={22} />} tone="violet" />
          <StatCard index={3} label="Properties" value={sum(props)} icon={<Building2 size={22} />} tone="emerald" />
          <StatCard index={4} label="Bookings" value={sum(bookings)} icon={<FileCheck2 size={22} />} tone="amber" />
          <StatCard index={5} label="Manual reviews" value={Number(d.manual_review_gender_cases) || 0} icon={<AlertCircle size={22} />} tone="rose" hint="Gender policy cases" />
        </div>

        {/* Needs attention */}
        <Card className="p-5 mb-6">
          <h2 className="font-bold text-brand-navy mb-4">Needs your attention</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {queues.map((q, i) => (
              <motion.div
                key={q.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.25 }}
              >
                <Link
                  to={q.to}
                  className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-primary-50/40 hover:border-primary-200 hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">{q.icon}</span>
                    <div>
                      <p className="text-2xl font-extrabold text-brand-navy leading-none">{Number(q.value) || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">{q.label}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ChartCard title="Bookings by status" subtitle="All-time" className="lg:col-span-2" empty={!objectToRows(bookings).length}>
            <SimpleBarChart data={objectToRows(bookings)} series={[{ key: 'value', label: 'Bookings' }]} />
          </ChartCard>
          <ChartCard title="Properties by status" empty={!objectToRows(props).length}>
            <DonutChart data={objectToRows(props)} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Supply vs demand by city" subtitle="Beds listed vs bookings made" className="lg:col-span-2" empty={!supplyDemand.length}>
            <SimpleBarChart
              data={supplyDemand}
              series={[{ key: 'supply', label: 'Beds (supply)' }, { key: 'demand', label: 'Bookings (demand)' }]}
            />
          </ChartCard>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-brand-navy">Recent activity</h3>
              <Link to="/admin/audit" className="text-xs font-semibold text-primary-600 hover:text-primary-800">View all</Link>
            </div>
            {audit.loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity.</p>
            ) : (
              <ul className="space-y-4">
                {logs.map((l, i) => (
                  <li key={l.log_id || l.id || i} className="flex gap-3">
                    <span className="mt-0.5 w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <ScrollText size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{String(l.action || '').replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {l.entity_type || 'system'} · {formatDate(l.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {d.notification_rates && (
          <Card className="p-5 mt-6 flex flex-wrap items-center gap-6">
            <h3 className="font-bold text-brand-navy mr-auto">Notification delivery health</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Failure rate <StatusBadge status={`${(d.notification_rates.failure_rate || 0).toFixed(1)}%`} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Bounce rate <StatusBadge status={`${(d.notification_rates.bounce_rate || 0).toFixed(1)}%`} />
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
