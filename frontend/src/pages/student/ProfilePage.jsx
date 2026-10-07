import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Button } from '../../components/ui';
import { AlertCircle, User, Mail, Shield, CheckCircle2, Edit3, Camera } from 'lucide-react';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/users/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then(d => {
        setData(d.data || d.users || d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [user]);

  if (loading) return (
    <PageTransition>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </PageTransition>
  );

  if (error) return (
    <PageTransition>
      <EmptyState icon={<AlertCircle size={48} className="text-red-400" />} title="Error" description={error} />
    </PageTransition>
  );

  // Derive initials for the avatar
  const initials = data?.name
    ? data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-navy via-indigo-900 to-indigo-800 h-48 shadow-lg flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>

        {/* Profile Info Card */}
        <Card className="relative -mt-24 mx-4 p-8 pt-16 rounded-3xl shadow-float bg-white/95 backdrop-blur border border-white flex flex-col items-center text-center">
          
          {/* Avatar */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-orange to-pink-500 p-1 shadow-xl">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-extrabold text-brand-navy border-4 border-white">
                  {initials}
                </div>
              </div>
              <button className="absolute bottom-1 right-1 bg-brand-navy text-white p-2.5 rounded-full shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all duration-300">
                <Camera size={18} />
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2 justify-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">{data?.name || 'Student User'}</h1>
            <CheckCircle2 size={24} className="text-blue-500 fill-blue-50" />
          </div>
          
          <p className="text-gray-500 font-medium flex items-center gap-2 mb-6">
            <Shield size={16} className="text-brand-orange" />
            <span className="uppercase tracking-wider text-xs font-bold text-gray-400">{data?.role || 'Student'}</span>
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8"></div>

          {/* Details Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-navy/20 transition-colors group">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                  <User size={20} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</span>
              </div>
              <p className="pl-12 font-semibold text-gray-900 capitalize">{data?.name || 'N/A'}</p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-navy/20 transition-colors group">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-orange-100 text-brand-orange rounded-lg group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
              </div>
              <p className="pl-12 font-semibold text-gray-900">{data?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 w-full justify-center md:justify-end">
            <Button variant="outline" className="gap-2 rounded-xl py-6 hover:bg-gray-50">
              <Edit3 size={18} />
              Edit Profile
            </Button>
          </div>
        </Card>

      </div>
    </PageTransition>
  );
}
