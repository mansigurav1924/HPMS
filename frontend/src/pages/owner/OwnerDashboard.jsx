import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Badge } from '../../components/ui';
import { 
  AlertCircle, Home, BedDouble, AlertTriangle, Users, Calendar, Clock, 
  MessageSquare, Settings, CreditCard, ChevronRight, CheckCircle, XCircle,
  Plus, PlusCircle, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const PAYMENTS_ENABLED = false; // as per spec

// Simple TimeAgo helper
const TimeAgo = ({ date }) => {
  if (!date) return null;
  const now = new Date();
  const d = new Date(date);
  const diffHours = Math.floor((d - now) / (1000 * 60 * 60));
  
  if (diffHours < 0) return <span className="text-red-500 font-bold">Overdue</span>;
  if (diffHours < 24) return <span className="text-orange-500 font-semibold">{diffHours}h left</span>;
  return <span className="text-gray-500">{Math.floor(diffHours/24)}d left</span>;
};

export default function OwnerDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('');

  useEffect(() => {
    let url = import.meta.env.VITE_API_URL + '/dashboard/owner';
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
      <EmptyState icon={<AlertCircle size={48} className="text-red-400" />} title="Error" description={error} />
    </PageTransition>
  );

  if (loading && !data) return (
    <PageTransition>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between"><Skeleton className="h-10 w-48"/><Skeleton className="h-10 w-64"/></div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-96"/><Skeleton className="h-96"/></div>
      </div>
    </PageTransition>
  );

  const { summary, needs_attention, overview } = data || {};
  const isNewOwner = !overview?.property_occupancy || overview.property_occupancy.length === 0;

  if (isNewOwner && !selectedProperty) {
    return (
      <PageTransition>
        <div className="p-8 max-w-5xl mx-auto text-center mt-20">
          <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <Home size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to HPMS!</h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            You don't have any properties set up yet. Get started by adding your first property to track occupancy, bookings, and more.
          </p>
          <Link to="/owner/properties/new" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
            <PlusCircle size={20} />
            Add your first property
          </Link>
        </div>
      </PageTransition>
    );
  }

  // Chart Data prep
  const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
  const bedPieData = overview ? [
    { name: 'Available', value: overview.bed_status.available || 0 },
    { name: 'Reserved', value: overview.bed_status.reserved || 0 },
    { name: 'Occupied', value: overview.bed_status.occupied || 0 },
    { name: 'Maintenance', value: overview.bed_status.maintenance || 0 }
  ].filter(d => d.value > 0) : [];

  const funnelData = overview ? [
    { name: 'Requested', count: overview.booking_funnel.requested },
    { name: 'Approved', count: overview.booking_funnel.approved },
    { name: 'Confirmed', count: overview.booking_funnel.confirmed },
    { name: 'Cancelled', count: overview.booking_funnel.cancelled + overview.booking_funnel.expired + overview.booking_funnel.rejected }
  ] : [];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8 bg-gray-50 min-h-screen">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Owner Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time overview of your business.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select 
              value={selectedProperty} 
              onChange={e => setSelectedProperty(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full md:w-64 p-3 font-medium transition-all"
            >
              <option value="">All Properties</option>
              {overview?.property_occupancy?.map(p => (
                <option key={p.property_id} value={p.property_id}>{p.name}</option>
              ))}
            </select>
            {PAYMENTS_ENABLED && (
              <Badge variant="success" className="whitespace-nowrap px-3 py-1">Payments Active</Badge>
            )}
          </div>
        </div>

        {/* 1. Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="p-5 border-l-4 border-l-blue-500 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <Activity size={18} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.occupancy_rate}%</p>
              <p className="text-xs text-gray-400 mt-2">{summary.occupied_beds} / {summary.total_beds} beds filled</p>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Vacant Beds</p>
                <BedDouble size={18} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.vacant_beds}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">Available now</p>
            </Card>

            <Link to="/bookings?status=requested" className="block">
              <Card className="p-5 border-l-4 border-l-amber-500 hover:-translate-y-1 transition-transform h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                  <Clock size={18} className="text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{summary.pending_requests}</p>
                {summary.soonest_response_due_at && summary.pending_requests > 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    Soonest due: <TimeAgo date={summary.soonest_response_due_at} />
                  </p>
                )}
              </Card>
            </Link>

            <Link to="/complaints" className="block">
              <Card className="p-5 border-l-4 border-l-red-500 hover:-translate-y-1 transition-transform h-full">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-500">Open Complaints</p>
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-gray-900">{summary.open_complaints}</p>
                  {summary.breached_complaints > 0 && (
                    <Badge variant="danger" className="mb-1 animate-pulse">{summary.breached_complaints} Escalated</Badge>
                  )}
                </div>
              </Card>
            </Link>

            <Card className="p-5 border-l-4 border-l-purple-500 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-500">Upcoming Check-outs</p>
                <Calendar size={18} className="text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.upcoming_checkouts}</p>
              <p className="text-xs text-gray-400 mt-2">In the next 30 days</p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 3. Overview Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Occupancy Bar Chart (Only if multiple properties or explicitly viewing one) */}
              {overview?.property_occupancy && (overview.property_occupancy.length > 1 || selectedProperty) && (
                <Card className="p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Home size={18} className="text-blue-500"/> Occupancy by Property
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview.property_occupancy}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                        <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Bar dataKey="occupied" name="Occupied Beds" stackId="a" fill="#3B82F6" radius={[0,0,4,4]} barSize={30} />
                        <Bar dataKey="total" name="Total Beds" fill="#E5E7EB" radius={[4,4,0,0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Bed Status Pie Chart */}
              <Card className="p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <BedDouble size={18} className="text-emerald-500"/> Bed Status Breakdown
                </h3>
                <div className="h-64 relative">
                  {bedPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bedPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          {bedPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">No beds configured</div>
                  )}
                  {/* Custom Legend */}
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {bedPieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Booking Funnel */}
              <Card className="p-6 shadow-sm border border-gray-100 md:col-span-2">
                 <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500"/> Booking Funnel (Last 30 Days)
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#4b5563', fontWeight: 500}} width={80} />
                        <RechartsTooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} barSize={24}>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#cbd5e1', '#93c5fd', '#3b82f6', '#f87171'][index % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </Card>
            </div>

            {/* 2. Needs Attention Lists */}
            {needs_attention && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Bookings Awaiting Approval */}
                <Card className="p-0 overflow-hidden border border-amber-200 shadow-sm flex flex-col h-full">
                  <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2">
                      <Clock size={18}/> Awaiting Approval
                    </h3>
                    <Badge variant="warning">{needs_attention.booking_requests.length}</Badge>
                  </div>
                  <div className="divide-y divide-gray-100 flex-1">
                    {needs_attention.booking_requests.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">All caught up!</div>
                    ) : (
                      needs_attention.booking_requests.map(req => (
                        <Link key={req.booking_id} to={`/bookings/${req.booking_id}`} className="block p-4 hover:bg-amber-50/50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-gray-900">{req.student_name}</span>
                            <TimeAgo date={req.owner_response_due_at} />
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{req.property_name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link to="/bookings?status=requested" className="p-3 bg-gray-50 text-center text-sm font-medium text-blue-600 hover:text-blue-800 border-t border-gray-100">View all requests</Link>
                </Card>

                {/* Priority Complaints */}
                <Card className="p-0 overflow-hidden border border-red-200 shadow-sm flex flex-col h-full">
                  <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                    <h3 className="font-bold text-red-900 flex items-center gap-2">
                      <AlertTriangle size={18}/> Open Complaints
                    </h3>
                    <Badge variant="danger">{needs_attention.complaints.length}</Badge>
                  </div>
                  <div className="divide-y divide-gray-100 flex-1">
                    {needs_attention.complaints.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No active complaints.</div>
                    ) : (
                      needs_attention.complaints.map(c => (
                        <Link key={c.complaint_id} to={`/complaints/${c.complaint_id}`} className="block p-4 hover:bg-red-50/50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-gray-900 line-clamp-1 pr-2">{c.title}</span>
                            {c.escalation_level > 0 ? (
                              <Badge variant="danger" className="text-[10px] uppercase">Escalated</Badge>
                            ) : (
                              <Badge variant={c.priority === 'High' ? 'warning' : 'neutral'} className="text-[10px] uppercase">{c.priority}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{c.property_name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link to="/complaints" className="p-3 bg-gray-50 text-center text-sm font-medium text-blue-600 hover:text-blue-800 border-t border-gray-100">View all complaints</Link>
                </Card>

                {/* Ready for Check-in */}
                <Card className="p-0 overflow-hidden border border-emerald-200 shadow-sm flex flex-col h-full">
                  <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                    <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle size={18}/> Next 7 Days Arrivals
                    </h3>
                    <Badge variant="success">{needs_attention.ready_for_checkin.length}</Badge>
                  </div>
                  <div className="divide-y divide-gray-100 flex-1">
                    {needs_attention.ready_for_checkin.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No upcoming arrivals.</div>
                    ) : (
                      needs_attention.ready_for_checkin.map(b => (
                        <Link key={b.booking_id} to={`/bookings/${b.booking_id}`} className="block p-4 hover:bg-emerald-50/50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-gray-900">{b.student_name}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                              {new Date(b.move_in_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{b.property_name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link to="/bookings?status=approved" className="p-3 bg-gray-50 text-center text-sm font-medium text-blue-600 hover:text-blue-800 border-t border-gray-100">View all confirmed</Link>
                </Card>

                {/* Notice Tenants */}
                <Card className="p-0 overflow-hidden border border-purple-200 shadow-sm flex flex-col h-full">
                  <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      <Calendar size={18}/> Notice Period
                    </h3>
                    <Badge className="bg-purple-100 text-purple-800">{needs_attention.notice_tenants.length}</Badge>
                  </div>
                  <div className="divide-y divide-gray-100 flex-1">
                    {needs_attention.notice_tenants.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No tenants leaving soon.</div>
                    ) : (
                      needs_attention.notice_tenants.map(t => (
                        <Link key={t.tenancy_id} to={`/tenancies/${t.tenancy_id}`} className="block p-4 hover:bg-purple-50/50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-gray-900">{t.student_name}</span>
                            <span className="text-xs text-gray-500">
                              Leaves: <span className="font-medium text-gray-900">{new Date(t.last_stay_date).toLocaleDateString()}</span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{t.property_name}</p>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link to="/tenancies?status=notice" className="p-3 bg-gray-50 text-center text-sm font-medium text-blue-600 hover:text-blue-800 border-t border-gray-100">View all leaving</Link>
                </Card>

              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* 4. Quick Actions */}
            <Card className="p-5 shadow-sm border border-gray-100 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/owner/properties/new" className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm text-center gap-2">
                  <Home size={20} />
                  <span className="text-xs font-medium">Add Property</span>
                </Link>
                <Link to="/notices/new" className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm text-center gap-2">
                  <MessageSquare size={20} />
                  <span className="text-xs font-medium">Post Notice</span>
                </Link>
                <Link to="/owner/properties" className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm text-center gap-2">
                  <BedDouble size={20} />
                  <span className="text-xs font-medium">Manage Rooms</span>
                </Link>
                <Link to="/maintenance/new" className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm text-center gap-2">
                  <Settings size={20} />
                  <span className="text-xs font-medium">Maintenance</span>
                </Link>
              </div>
            </Card>

            {/* Money Widgets (Hidden if PAYMENTS_ENABLED is false) */}
            {PAYMENTS_ENABLED && (
              <Card className="p-5 shadow-sm border border-green-200 bg-green-50">
                <h3 className="font-bold text-green-900 flex items-center gap-2 mb-4">
                  <CreditCard size={18} /> Financial Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Collected this month</span>
                    <span className="font-bold text-green-900">₹45,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800">Pending rent</span>
                    <span className="font-bold text-red-600">₹12,500</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-green-200">
                    <span className="text-sm text-green-800">Overdue Tenants</span>
                    <Badge variant="danger">3</Badge>
                  </div>
                </div>
              </Card>
            )}

            {/* Latest Reviews */}
            {overview?.latest_reviews && (
              <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-bold text-gray-900">Latest Reviews</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-bold text-yellow-500">★ {overview.avg_rating}</span>
                      <span className="text-xs text-gray-500">Avg Rating</span>
                    </div>
                  </div>
                  {overview.missing_replies > 0 && (
                    <div className="text-right">
                      <Badge variant="warning">{overview.missing_replies} unreplied</Badge>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-gray-50 flex-1">
                  {overview.latest_reviews.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">No reviews yet.</div>
                  ) : (
                    overview.latest_reviews.map(r => (
                      <div key={r.review_id} className="p-4 bg-white">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{r.student_name}</span>
                          <span className="text-yellow-500 text-xs font-bold">★ {r.rating}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            {overview?.recent_activity && (
              <Card className="p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-gray-400" /> Recent Activity
                </h3>
                <div className="space-y-4">
                  {overview.recent_activity.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
                  ) : (
                    overview.recent_activity.map((act, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-0.5">
                          {act.type === 'booking' ? <PlusCircle size={16} className="text-blue-500"/> : <AlertCircle size={16} className="text-red-500"/>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{act.description}</p>
                          <p className="text-xs text-gray-400">{new Date(act.ts).toLocaleString()}</p>
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
