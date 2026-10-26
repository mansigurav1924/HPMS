import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Modal } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Building2, BedDouble, Calendar, CreditCard, AlertTriangle, 
  FileText, Phone, MapPin, ArrowRight, ShieldCheck, CheckCircle2,
  Clock, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function StayPage() {
  const { token } = useAuth();
  const [tenancies, setTenancies] = useState([]);
  const [studentDash, setStudentDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notice Modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [noticeDate, setNoticeDate] = useState('');
  const [submittingNotice, setSubmittingNotice] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        fetch(`${API}/tenancies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/dashboard/student`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        setTenancies(tData.tenancies || []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setStudentDash(dData.data || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleGiveNotice = async (e) => {
    e.preventDefault();
    if (!selectedTenancy || !noticeDate) {
      toast.error('Please choose your intended move-out notice date.');
      return;
    }

    setSubmittingNotice(true);
    try {
      const res = await fetch(`${API}/tenancies/${selectedTenancy.id}/notice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notice_date: noticeDate })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to submit move-out notice');
      }

      toast.success('Move-out notice submitted to your property owner.');
      setNoticeModalOpen(false);
      setSelectedTenancy(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingNotice(false);
    }
  };

  const activeStayHero = studentDash?.hero?.tenancy;
  const displayTenancies = tenancies.length > 0 
    ? tenancies 
    : (activeStayHero ? [{
        id: activeStayHero.tenancy_id,
        status: activeStayHero.status || 'active',
        rent: activeStayHero.rent,
        property_id: activeStayHero.property_id,
        bed_id: activeStayHero.bed_id,
        check_in_date: activeStayHero.check_in_date
      }] : []);

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <PageHeader 
          title="My Stay & Residence Details"
          subtitle="View room allocation, check-in terms, and manage your tenancy lifecycle."
        />

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
          </div>
        ) : error ? (
          <EmptyState 
            icon={<AlertTriangle size={48} className="text-rose-500" />}
            title="Unable to load stay information"
            description={error}
          />
        ) : displayTenancies.length === 0 ? (
          <EmptyState 
            icon={<Building2 size={48} className="text-gray-300" />}
            title="No Active Tenancy Found"
            description="You are currently not checked into any hostel or PG. Browse verified properties to find your ideal student accommodation."
            action={
              <Link to="/search" className="btn-cta inline-flex items-center gap-2">
                <span>Browse Student Stays</span>
                <ArrowRight size={16} />
              </Link>
            }
          />
        ) : (
          <div className="space-y-8">
            {displayTenancies.map(tenancy => {
              const propName = activeStayHero?.property_name || `Property #${tenancy.property_id?.substring(0, 8)}`;
              const roomBed = activeStayHero?.room_number 
                ? `Room ${activeStayHero.room_number} · Bed ${activeStayHero.bed_label || ''}`
                : `Bed Assignment #${tenancy.bed_id?.substring(0, 8)}`;

              return (
                <div 
                  key={tenancy.id}
                  className="card p-0 overflow-hidden shadow-float border border-gray-100"
                >
                  {/* Hero Header */}
                  <div className="bg-gradient-to-r from-[#0F1535] to-[#1E295F] text-white p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <StatusBadge status={tenancy.status} />
                          <span className="text-xs text-indigo-200 font-medium">
                            Tenancy ID: {tenancy.id?.substring(0, 8)}
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                          {propName}
                        </h2>
                        <p className="text-indigo-200 font-semibold text-sm mt-1 flex items-center gap-2">
                          <BedDouble size={16} className="text-primary-300" />
                          <span>{roomBed}</span>
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-right">
                        <span className="text-[11px] uppercase tracking-wider text-indigo-200 block">
                          Agreed Rent
                        </span>
                        <span className="text-2xl font-extrabold text-white">
                          ₹{tenancy.rent?.toLocaleString('en-IN') || '—'}/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Calendar size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          Check-in Date
                        </span>
                        <p className="font-extrabold text-brand-navy text-base">
                          {tenancy.check_in_date ? new Date(tenancy.check_in_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Check-in Confirmed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          Stay Status
                        </span>
                        <p className="font-extrabold text-emerald-700 capitalize text-base">
                          {tenancy.status === 'active' ? 'Active Resident' : tenancy.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          Notice Period
                        </span>
                        <p className="font-extrabold text-brand-navy text-base">
                          30 Days Standard
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="md:col-span-3 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 mt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link to="/complaints" className="btn-secondary !py-2.5 !text-xs font-bold flex items-center gap-2">
                          <AlertTriangle size={15} className="text-amber-500" />
                          <span>Raise Maintenance Issue</span>
                        </Link>

                        {activeStayHero?.agreement_url && (
                          <a 
                            href={activeStayHero.agreement_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary !py-2.5 !text-xs font-bold flex items-center gap-2"
                          >
                            <Download size={15} />
                            <span>Digital Tenancy Agreement</span>
                          </a>
                        )}
                      </div>

                      {tenancy.status === 'active' && (
                        <button
                          onClick={() => {
                            setSelectedTenancy(tenancy);
                            setNoticeDate('');
                            setNoticeModalOpen(true);
                          }}
                          className="btn-danger !py-2.5 !text-xs font-bold"
                        >
                          Give Move-Out Notice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Give Notice Modal */}
        <Modal
          isOpen={noticeModalOpen}
          onClose={() => setNoticeModalOpen(false)}
          title="Submit Move-Out Notice"
        >
          <form onSubmit={handleGiveNotice} className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Submitting a move-out notice notifies your hostel owner and starts your notice period timeline. Your security deposit will be processed upon room inspection on your move-out date.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Intended Move-Out Date *
              </label>
              <input
                type="date"
                value={noticeDate}
                onChange={e => setNoticeDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="field-input w-full"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setNoticeModalOpen(false)}
                className="btn-secondary"
                disabled={submittingNotice}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger !py-2.5"
                disabled={submittingNotice}
              >
                {submittingNotice ? 'Submitting...' : 'Confirm Notice Date'}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </PageTransition>
  );
}
