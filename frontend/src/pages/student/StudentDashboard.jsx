import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Link } from 'react-router-dom';
import { PageTransition, Skeleton, Button, Card, Badge } from '../../components/ui';
import { Search, MapPin, AlertTriangle, CheckCircle, Clock, Home, FileText, Bell, MessageSquare, Star, ArrowRight } from 'lucide-react';

const PAYMENTS_ENABLED = false;

export default function StudentDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/dashboard/student', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dashboard data');
        return res.json();
      })
      .then(d => {
        setData(d.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto p-8 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </PageTransition>
    );
  }

  const { hero, attention, widgets } = data;
  const { tenancy, booking } = hero;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Needs-Attention Banners */}
        <div className="space-y-3">
          {attention.minor_missing_consent && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Guardian Consent Required</h4>
                  <p className="text-sm">As a minor, you must provide verified guardian consent to book a property.</p>
                </div>
              </div>
              <Link to="/student/profile"><Button size="sm" variant="danger" className="whitespace-nowrap">Verify Now</Button></Link>
            </div>
          )}
          {(!attention.email_verified || !attention.phone_verified) && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Contact Verification Needed</h4>
                  <p className="text-sm">Please verify your email and phone number to secure your account.</p>
                </div>
              </div>
              <Link to="/student/profile"><Button size="sm" variant="warning" className="whitespace-nowrap">Verify Contacts</Button></Link>
            </div>
          )}
          {attention.profile_incomplete && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Incomplete Profile</h4>
                  <p className="text-sm">Complete your profile (ID proof, college details) to easily book rooms.</p>
                </div>
              </div>
              <Link to="/student/profile"><Button size="sm" className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white">Complete Profile</Button></Link>
            </div>
          )}
          {attention.complaint_to_rate && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Complaint Resolved</h4>
                  <p className="text-sm">Please rate the resolution of your recent complaint (or reopen it within 24h).</p>
                </div>
              </div>
              <Link to={`/complaints`}><Button size="sm" className="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white">Rate Resolution</Button></Link>
            </div>
          )}
          {attention.unreviewed_checkout && (
            <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star className="text-purple-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">How was your stay?</h4>
                  <p className="text-sm">You recently checked out of {attention.unreviewed_checkout.property_name}. Leave a review!</p>
                </div>
              </div>
              <Link to={`/student/reviews`}><Button size="sm" className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white">Write Review</Button></Link>
            </div>
          )}
        </div>

        {/* State-Based Hero Section */}
        <div className="rounded-3xl shadow-sm border border-gray-100 overflow-hidden bg-white">
          {!tenancy && !booking ? (
            <div className="p-8 md:p-12 bg-gradient-to-br from-brand-navy to-indigo-900 text-white text-center">
              <h2 className="text-3xl font-extrabold mb-4">Find Your Perfect Stay</h2>
              <p className="text-indigo-200 mb-8 max-w-lg mx-auto">Discover and book verified hostels and PGs near your college.</p>
              <Link to="/search">
                <Button size="lg" className="bg-brand-orange hover:bg-orange-600 text-white px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Search size={20} className="mr-2" /> Find a Room
                </Button>
              </Link>
            </div>
          ) : tenancy ? (
            <div className="p-6 md:p-10 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge variant={tenancy.status === 'notice' ? "warning" : "success"} className="mb-3 uppercase tracking-wider text-[10px]">
                    {tenancy.status === 'notice' ? 'On Notice Period' : 'Active Tenancy'}
                  </Badge>
                  <h2 className="text-2xl font-extrabold text-brand-navy">{tenancy.property_name}</h2>
                  <p className="text-gray-500 font-medium">Room {tenancy.room_number || 'TBD'} • Bed {tenancy.bed_number || 'TBD'}</p>
                </div>
                {tenancy.status === 'active' && (
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Give Notice</Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Check-in</p>
                  <p className="font-semibold text-gray-900">{new Date(tenancy.check_in_date).toLocaleDateString()}</p>
                </div>
                {tenancy.status === 'notice' ? (
                  <div>
                    <p className="text-xs text-brand-orange font-bold uppercase mb-1">Check-out By</p>
                    <p className="font-semibold text-gray-900">{tenancy.expected_checkout_date ? new Date(tenancy.expected_checkout_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Agreement</p>
                    <a href={tenancy.agreement_url || "#"} className="text-blue-600 font-medium hover:underline flex items-center gap-1"><FileText size={14}/> View</a>
                  </div>
                )}
                <div className="col-span-2 flex justify-end items-center">
                  <Link to="/student/stay"><Button variant="secondary" size="sm">Manage Stay <ArrowRight size={14} className="ml-2"/></Button></Link>
                </div>
              </div>
            </div>
          ) : booking ? (
            <div className="p-6 md:p-10 bg-gradient-to-r from-gray-50 to-white">
              <Badge className="mb-3 uppercase tracking-wider text-[10px] bg-indigo-100 text-indigo-700">{booking.status.replace('_', ' ')}</Badge>
              <h2 className="text-2xl font-extrabold text-brand-navy mb-2">Booking at {booking.property_name}</h2>
              
              {['requested', 'payment_pending'].includes(booking.status) ? (
                <div>
                  <p className="text-gray-600 mb-4">Waiting for next steps. Request submitted on {new Date(booking.requested_at).toLocaleDateString()}.</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200">Cancel Request</Button>
                    <Link to="/student/bookings"><Button>View Details</Button></Link>
                  </div>
                </div>
              ) : ['approved', 'confirmed'].includes(booking.status) ? (
                <div>
                  <div className="flex flex-col md:flex-row gap-6 mb-6 mt-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 flex-1">
                      <Home className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Allotted</p>
                        <p className="font-semibold">Room {booking.room_number || 'TBD'} • Bed {booking.bed_number || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 flex-1">
                      <Clock className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Move-in Date</p>
                        <p className="font-semibold">{booking.move_in_date ? new Date(booking.move_in_date).toLocaleDateString() : 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline">Contact Owner</Button>
                    {booking.latitude && (
                      <Button variant="secondary"><MapPin size={16} className="mr-2" /> Directions</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">This booking is {booking.status}.</p>
                  <Link to="/search"><Button>Find Another Room</Button></Link>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Main Grid: Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Quick Links & Activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/complaints" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-navy/20 hover:shadow-md transition-all gap-2 text-center group">
                <div className="p-3 bg-orange-50 text-brand-orange rounded-xl group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div>
                <span className="font-bold text-gray-700 text-sm">Raise Complaint</span>
              </Link>
              <Link to="/student/notices" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-navy/20 hover:shadow-md transition-all gap-2 text-center group">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Bell size={24} /></div>
                <span className="font-bold text-gray-700 text-sm">View Notices</span>
              </Link>
              <Link to="/wishlist" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-navy/20 hover:shadow-md transition-all gap-2 text-center group">
                <div className="p-3 bg-pink-50 text-pink-600 rounded-xl group-hover:scale-110 transition-transform"><Heart size={24} /></div>
                <span className="font-bold text-gray-700 text-sm">Wishlist</span>
              </Link>
              <Link to="/student/profile" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-navy/20 hover:shadow-md transition-all gap-2 text-center group">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                <span className="font-bold text-gray-700 text-sm">Update Profile</span>
              </Link>
            </div>

            {/* Complaints Widget */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                  My Complaints {widgets.open_complaints > 0 && <span className="bg-brand-orange text-white text-xs px-2 py-0.5 rounded-full">{widgets.open_complaints} Open</span>}
                </h3>
                <Link to="/complaints" className="text-sm font-bold text-brand-orange hover:text-orange-600">View All</Link>
              </div>
              {widgets.complaints.length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-sm">No complaints raised.</div>
              ) : (
                <div className="space-y-4">
                  {widgets.complaints.map(c => (
                    <div key={c.complaint_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                        <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={c.status === 'resolved' ? 'success' : c.status === 'closed' ? 'neutral' : 'warning'}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Money Widgets (Hidden if PAYMENTS_ENABLED is false) */}
            {PAYMENTS_ENABLED && (
              <Card className="p-6 border-blue-100 bg-blue-50/30">
                <h3 className="text-lg font-bold text-brand-navy mb-4">Rent & Dues</h3>
                <p className="text-sm text-gray-600">Payments are currently paused.</p>
              </Card>
            )}

          </div>

          {/* Column 3: Side Widgets */}
          <div className="space-y-6">
            
            {/* Notices Widget */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-brand-navy">Notices</h3>
                <Link to="/student/notices" className="text-sm font-bold text-brand-orange hover:text-orange-600">View All</Link>
              </div>
              {widgets.notices.length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-sm">No active notices for your property.</div>
              ) : (
                <div className="space-y-4">
                  {widgets.notices.map(n => (
                    <div key={n.notice_id} className="border-l-2 border-blue-500 pl-3 py-1">
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{n.title}</p>
                      <p className="text-xs text-gray-500">{new Date(n.posted_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Notifications Widget */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-brand-navy">Notifications</h3>
                <Link to="/student/notifications" className="text-sm font-bold text-brand-orange hover:text-orange-600">View All</Link>
              </div>
              {widgets.notifications.length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-sm">No recent notifications.</div>
              ) : (
                <div className="space-y-4">
                  {widgets.notifications.map(n => (
                    <div key={n.notification_id} className="flex gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.read_at ? 'bg-gray-200' : 'bg-brand-orange'}`}></div>
                      <div>
                        <p className={`text-sm ${n.read_at ? 'text-gray-700' : 'font-bold text-gray-900'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

        </div>
      </div>
    </PageTransition>
  );
}
