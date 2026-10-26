import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Badge, Button } from '../../components/ui';
import { AlertCircle, FileText, CheckCircle2, Clock, CreditCard, Receipt, Calendar, Home } from 'lucide-react';
import Swal from '../../lib/swal';

export default function RentPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/tenancies', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then(d => {
        const result = d.data || d.tenancies || d;
        setData(Array.isArray(result) ? result : [result]);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [user, token]);

  if (loading) return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </PageTransition>
  );

  if (error) return (
    <PageTransition>
      <EmptyState icon={<AlertCircle size={48} className="text-red-400" />} title="Error" description={error} />
    </PageTransition>
  );

  const handlePayNow = () => {
    Swal.fire({
      title: 'Payment Gateway',
      text: 'Payments are currently bypassed in the testing environment.',
      icon: 'info',
      confirmButtonColor: '#ff6b35'
    });
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-brand-navy">Rent & Dues</h1>
        </div>
        
        {!data || data.length === 0 ? (
          <EmptyState icon={<FileText size={48} className="text-gray-300" />} title="No active tenancy" description="You do not have any active rent dues." />
        ) : (
          <div className="space-y-8">
            {data.map((tenancy, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-card hover:shadow-hover transition-all">
                {/* Header section */}
                <div className="bg-gradient-to-r from-brand-navy to-indigo-900 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  
                  <div className="relative z-10">
                    <p className="text-indigo-200 font-bold uppercase tracking-wider text-xs mb-1">Current Monthly Rent</p>
                    <div className="text-4xl font-extrabold tracking-tight">
                      ₹{tenancy.rent?.toLocaleString('en-IN') || 'N/A'} <span className="text-lg font-medium text-indigo-200">/ mo</span>
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex gap-3 items-center">
                    <Badge className={tenancy.status === 'active' ? 'bg-green-500/20 text-green-100 border border-green-400/30 backdrop-blur' : 'bg-white/20 text-white border border-white/30 backdrop-blur'}>
                      {tenancy.status === 'active' ? <CheckCircle2 size={14} className="mr-1 inline-block" /> : null}
                      <span className="capitalize">{tenancy.status}</span>
                    </Badge>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 bg-white flex flex-col md:flex-row gap-8">
                  <div className="flex-1 grid grid-cols-2 gap-6">
                    <div className="flex gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl h-fit">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Check-in Date</p>
                        <p className="font-semibold text-gray-900">{tenancy.check_in_date ? new Date(tenancy.check_in_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="p-2.5 bg-orange-50 text-brand-orange rounded-xl h-fit">
                        <Home size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Tenancy ID</p>
                        <p className="font-mono text-sm font-semibold text-gray-900 truncate max-w-[120px]" title={tenancy.id || tenancy.tenancy_id}>{tenancy.id?.substring(0, 8) || tenancy.tenancy_id?.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                    <p className="text-sm text-gray-500 mb-4 font-medium">Your rent for this month is due soon.</p>
                    <Button onClick={handlePayNow} className="w-full btn-primary py-4 shadow-lg flex items-center justify-center gap-2">
                      <CreditCard size={18} />
                      Pay Rent Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Payment History — payments API is currently paused, so no records to show */}
            <div className="pt-6">
              <h2 className="text-xl font-extrabold text-brand-navy mb-4 flex items-center gap-2">
                <Receipt size={24} className="text-brand-orange" />
                Payment History
              </h2>
              <Card className="p-0 border border-gray-100 overflow-hidden shadow-sm">
                <EmptyState
                  icon={<Receipt size={40} className="text-gray-300" />}
                  title="No payments recorded"
                  description="Online payments are currently paused. Your payment records will appear here once payments are enabled."
                />
              </Card>
            </div>

          </div>
        )}
      </div>
    </PageTransition>
  );
}
