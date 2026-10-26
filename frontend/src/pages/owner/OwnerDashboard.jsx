import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card } from '../../components/ui';
import { PageHeader, StatCard, StatusBadge } from '../../components/ui/data';
import { ChartCard, SimpleBarChart, DonutChart } from '../../components/charts';
import { 
  Building2, BedDouble, AlertTriangle, Users, Calendar, Clock, 
  MessageSquare, Settings, CreditCard, ChevronRight, CheckCircle2, 
  Plus, PlusCircle, Activity, Star, ArrowUpRight, ShieldAlert, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PAYMENTS_ENABLED = false;

const TimeAgo = ({ date }) => {
  if (!date) return null;
  const now = new Date();
  const d = new Date(date);
  const diffHours = Math.floor((d - now) / (1000 * 60 * 60));
  
  if (diffHours < 0) return <span className="text-rose-600 font-bold">Overdue</span>;
  if (diffHours < 24) return <span className="text-amber-600 font-semibold">{diffHours}h left</span>;
  return <span className="text-gray-500">{Math.floor(diffHours / 24)}d left</span>;
};

export default function OwnerDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('');

  useEffect(() => {
    let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    let url = apiBase + '/dashboard/owner';
    if (selectedProperty) {
      url += `?property_id=${selectedProperty}`;
    }
    setLoading(true);
    fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error("Backend Error: " + d.error);
        setData(d.data || {});
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [user, token, selectedProperty]);

  if (error) return (
    <PageTransition>
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState icon={<AlertTriangle size={48} className="text-rose-500" />} title="Dashboard Unavailable" description={error} />
      </div>
    </PageTransition>
  );

  if (loading && !data) return (
    <PageTransition>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </PageTransition>
  );

  const { summary, needs_attention, overview } = data || {};
  const isNewOwner = !overview?.property_occupancy || overview.property_occupancy.length === 0;

  if (isNewOwner && !selectedProperty) {
    return (
      <PageTransition>
        <div className="p-8 max-w-3xl mx-auto text-center mt-16 card p-10 shadow-float">
          <div className="mx-auto w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mb-6 shadow-glow">
            <Building2 size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-brand-navy mb-3 tracking-tight">Welcome to HPMS Owner Hub!</h2>
          <p className="text-gray-500 text-base mb-8 max-w-lg mx-auto">
            You don't have any properties set up yet. Add your first hostel or PG to start tracking occupancy, tenant bookings, and automated rent operations.
          </p>
          <Link to="/owner/properties/new" className="btn-cta inline-flex items-center gap-2">
            <PlusCircle size={20} />
            Add Your First Property
          </Link>
        </div>
      </PageTransition>
    );
  }

  // Bed status donut chart data
  const bedStatusData = overview ? [
    { name: 'Available', value: overview.bed_status.available || 0 },
    { name: 'Occupied', value: overview.bed_status.occupied || 0 },
    { name: 'Reserved', value: overview.bed_status.reserved || 0 },
    { name: 'Maintenance', value: overview.bed_status.maintenance || 0 }
  ].filter(d => d.value > 0) : [];

  // Occupancy bar chart data
  const occupancyBarData = overview?.property_occupancy?.map(p => ({
    name: p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name,
    Occupied: p.occupied,
    Vacant: Math.max(0, p.total - p.occupied)
  })) || [];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Filter Controls */}
        <PageHeader 
          title="Owner Operations Dashboard"
          subtitle="Real-time occupancy metrics, booking requests, and tenant workflows."
          actions={
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select 
                value={selectedProperty} 
                onChange={e => setSelectedProperty(e.target.value)}
                className="field-input !h-11 sm:w-60 font-medium"
                aria-label="Filter by property"
              >
                <option value="">All Managed Properties</option>
                {overview?.property_occupancy?.map(p => (
                  <option key={p.property_id} value={p.property_id}>{p.name}</option>
                ))}
              </select>
              <Link to="/owner/properties/new" className="btn-cta !py-2.5 whitespace-nowrap flex items-center gap-2 shrink-0">
                <Plus size={18} />
                <span className="hidden sm:inline">Add Property</span>
              </Link>
            </div>
          }
        />

        {/* 1. Summary Metrics */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard 
              label="Occupancy Rate"
              value={summary.occupancy_rate}
              suffix="%"
              tone="indigo"
              icon={<Activity size={22} />}
              hint={`${summary.occupied_beds} of ${summary.total_beds} beds filled`}
              index={0}
            />

            <StatCard 
              label="Vacant Beds"
              value={summary.vacant_beds}
              tone="emerald"
              icon={<BedDouble size={22} />}
              hint="Ready for immediate check-in"
              index={1}
            />

            <Link to="/owner/bookings?status=requested" className="block h-full">
              <StatCard 
                label="Booking Requests"
                value={summary.pending_requests}
                tone="amber"
                icon={<Clock size={22} />}
                hint={
                  summary.soonest_response_due_at && summary.pending_requests > 0
                    ? <span>Due: <TimeAgo date={summary.soonest_response_due_at} /></span>
                    : "No action pending"
                }
                index={2}
              />
            </Link>

            <Link to="/owner/complaints" className="block h-full">
              <StatCard 
                label="Open Complaints"
                value={summary.open_complaints}
                tone="rose"
                icon={<AlertTriangle size={22} />}
                hint={summary.breached_complaints > 0 ? `${summary.breached_complaints} SLA breached` : "Under active resolution"}
                index={3}
              />
            </Link>

            <StatCard 
              label="Upcoming Checkouts"
              value={summary.upcoming_checkouts}
              tone="violet"
              icon={<Calendar size={22} />}
              hint="In next 30 days"
              index={4}
            />
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Charts & Needs Attention Lists */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visual Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <ChartCard 
                title="Bed Allocation Status" 
                subtitle="Live status across available rooms"
                empty={bedStatusData.length === 0}
              >
                <DonutChart data={bedStatusData} />
              </ChartCard>

              <ChartCard 
                title="Occupancy Breakdown" 
                subtitle="Occupied vs vacant beds per property"
                empty={occupancyBarData.length === 0}
              >
                <SimpleBarChart 
                  data={occupancyBarData} 
                  series={[
                    { key: 'Occupied', label: 'Occupied' },
                    { key: 'Vacant', label: 'Vacant' }
                  ]}
                />
              </ChartCard>

            </div>

            {/* Needs Attention Action Center */}
            {needs_attention && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-brand-navy tracking-tight flex items-center gap-2">
                    <ShieldAlert size={20} className="text-amber-500" />
                    Needs Your Attention
                  </h2>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    High Priority Queues
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 1. Pending Booking Approvals */}
                  <Card className="p-0 overflow-hidden border border-amber-200/60 shadow-sm flex flex-col">
                    <div className="p-4 bg-amber-50/80 border-b border-amber-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                        <Clock size={16} className="text-amber-600" />
                        <span>Awaiting Approval</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900">
                        {needs_attention.booking_requests.length}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 flex-1">
                      {needs_attention.booking_requests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">All booking requests are handled.</div>
                      ) : (
                        needs_attention.booking_requests.map(req => (
                          <Link 
                            key={req.booking_id} 
                            to="/owner/bookings" 
                            className="block p-4 hover:bg-amber-50/40 transition-colors group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-brand-navy text-sm group-hover:text-primary-600 transition-colors">
                                {req.student_name}
                              </span>
                              <TimeAgo date={req.owner_response_due_at} />
                            </div>
                            <p className="text-xs text-gray-500 truncate">{req.property_name}</p>
                          </Link>
                        ))
                      )}
                    </div>

                    <Link 
                      to="/owner/bookings" 
                      className="p-3 bg-gray-50 hover:bg-gray-100 text-center text-xs font-bold text-primary-600 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Manage All Bookings</span>
                      <ChevronRight size={14} />
                    </Link>
                  </Card>

                  {/* 2. Urgent Complaints */}
                  <Card className="p-0 overflow-hidden border border-rose-200/60 shadow-sm flex flex-col">
                    <div className="p-4 bg-rose-50/80 border-b border-rose-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                        <AlertTriangle size={16} className="text-rose-600" />
                        <span>Open Complaints</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-200/80 text-rose-900">
                        {needs_attention.complaints.length}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 flex-1">
                      {needs_attention.complaints.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">No active complaints across properties.</div>
                      ) : (
                        needs_attention.complaints.map(c => (
                          <Link 
                            key={c.complaint_id} 
                            to="/owner/complaints" 
                            className="block p-4 hover:bg-rose-50/40 transition-colors group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-brand-navy text-sm group-hover:text-rose-600 transition-colors truncate pr-2">
                                {c.title}
                              </span>
                              {c.escalation_level > 0 ? (
                                <StatusBadge status="escalated" />
                              ) : (
                                <StatusBadge status={c.priority === 'High' ? 'open' : 'acknowledged'} />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.property_name}</p>
                          </Link>
                        ))
                      )}
                    </div>

                    <Link 
                      to="/owner/complaints" 
                      className="p-3 bg-gray-50 hover:bg-gray-100 text-center text-xs font-bold text-rose-600 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>View Complaints Center</span>
                      <ChevronRight size={14} />
                    </Link>
                  </Card>

                  {/* 3. Upcoming 7-day arrivals */}
                  <Card className="p-0 overflow-hidden border border-emerald-200/60 shadow-sm flex flex-col">
                    <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>Arrivals in Next 7 Days</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200/80 text-emerald-900">
                        {needs_attention.ready_for_checkin.length}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 flex-1">
                      {needs_attention.ready_for_checkin.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">No arrivals scheduled this week.</div>
                      ) : (
                        needs_attention.ready_for_checkin.map(b => (
                          <div key={b.booking_id} className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-brand-navy text-sm">{b.student_name}</p>
                              <p className="text-xs text-gray-500 truncate">{b.property_name}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                              {new Date(b.move_in_date).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <Link 
                      to="/owner/tenants" 
                      className="p-3 bg-gray-50 hover:bg-gray-100 text-center text-xs font-bold text-emerald-600 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>View Tenant Directory</span>
                      <ChevronRight size={14} />
                    </Link>
                  </Card>

                  {/* 4. Notice Period Tenants */}
                  <Card className="p-0 overflow-hidden border border-violet-200/60 shadow-sm flex flex-col">
                    <div className="p-4 bg-violet-50/80 border-b border-violet-100 flex justify-between items-center">
                      <div className="flex items-center gap-2 font-bold text-violet-900 text-sm">
                        <Calendar size={16} className="text-violet-600" />
                        <span>Upcoming Vacancies (Notice)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-200/80 text-violet-900">
                        {needs_attention.notice_tenants.length}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 flex-1">
                      {needs_attention.notice_tenants.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">No tenants currently on notice.</div>
                      ) : (
                        needs_attention.notice_tenants.map(t => (
                          <div key={t.tenancy_id} className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-brand-navy text-sm">{t.student_name}</p>
                              <p className="text-xs text-gray-500 truncate">{t.property_name}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500 block">Vacating</span>
                              <span className="text-xs font-bold text-brand-navy">
                                {new Date(t.last_stay_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Link 
                      to="/owner/tenants" 
                      className="p-3 bg-gray-50 hover:bg-gray-100 text-center text-xs font-bold text-violet-600 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Manage All Tenancies</span>
                      <ChevronRight size={14} />
                    </Link>
                  </Card>

                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar: Shortcuts & Feeds */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F1535] to-[#1E295F] text-white shadow-float relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary-300" />
                <h3 className="font-extrabold text-base tracking-tight">Quick Actions</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  to="/owner/properties/new" 
                  className="flex flex-col items-center justify-center p-3.5 bg-white/10 hover:bg-white/15 rounded-xl transition-all border border-white/10 text-center gap-2 group"
                >
                  <Building2 size={20} className="text-primary-300 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">New Property</span>
                </Link>

                <Link 
                  to="/owner/notices" 
                  className="flex flex-col items-center justify-center p-3.5 bg-white/10 hover:bg-white/15 rounded-xl transition-all border border-white/10 text-center gap-2 group"
                >
                  <MessageSquare size={20} className="text-emerald-300 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Post Notice</span>
                </Link>

                <Link 
                  to="/owner/properties" 
                  className="flex flex-col items-center justify-center p-3.5 bg-white/10 hover:bg-white/15 rounded-xl transition-all border border-white/10 text-center gap-2 group"
                >
                  <BedDouble size={20} className="text-amber-300 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Manage Rooms</span>
                </Link>

                <Link 
                  to="/owner/reports" 
                  className="flex flex-col items-center justify-center p-3.5 bg-white/10 hover:bg-white/15 rounded-xl transition-all border border-white/10 text-center gap-2 group"
                >
                  <ArrowUpRight size={20} className="text-violet-300 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Export Data</span>
                </Link>
              </div>
            </div>

            {/* Latest Reviews Card */}
            {overview?.latest_reviews && (
              <Card className="p-0 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h3 className="font-extrabold text-brand-navy text-sm">Tenant Ratings & Reviews</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={14} 
                            className={star <= Math.round(overview.avg_rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-brand-navy">{overview.avg_rating} / 5</span>
                    </div>
                  </div>
                  {overview.missing_replies > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      {overview.missing_replies} unreplied
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {overview.latest_reviews.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">No student reviews yet.</div>
                  ) : (
                    overview.latest_reviews.slice(0, 3).map(r => (
                      <div key={r.review_id} className="p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-brand-navy">{r.student_name}</span>
                          <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                            ★ {r.rating}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{r.comment || 'No comment provided.'}</p>
                        {r.owner_reply && (
                          <div className="mt-2 text-[11px] bg-primary-50 text-primary-800 p-2 rounded-lg">
                            <span className="font-bold">Your reply: </span>{r.owner_reply}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <Link 
                  to="/owner/reviews" 
                  className="p-3 bg-gray-50 hover:bg-gray-100 text-center text-xs font-bold text-primary-600 border-t border-gray-100 transition-colors block"
                >
                  View All Reviews & Replies →
                </Link>
              </Card>
            )}

            {/* Recent Activity Log */}
            {overview?.recent_activity && (
              <Card className="p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-gray-400" />
                  <h3 className="font-extrabold text-brand-navy text-sm">Recent Audit Trail</h3>
                </div>

                <div className="space-y-4">
                  {overview.recent_activity.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No recent activity logged.</p>
                  ) : (
                    overview.recent_activity.slice(0, 5).map((act, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'booking' ? 'bg-primary-500' : 'bg-rose-500'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-brand-navy truncate">{act.description}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{new Date(act.ts).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

          </div>

        </div>

      </div>
    </PageTransition>
  );
}
