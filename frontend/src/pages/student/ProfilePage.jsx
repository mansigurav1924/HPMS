import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Button, Modal } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  AlertCircle, User, Mail, Shield, CheckCircle2, Edit3, Camera, 
  Phone, GraduationCap, HeartHandshake, UploadCloud, Sparkles
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Avatar state from localStorage
  const fileInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem(`hpms_avatar_${user?.id || 'current'}`) || '';
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAvatarUrl(dataUrl);
      localStorage.setItem(`hpms_avatar_${user?.id || 'current'}`, dataUrl);
      toast.success('Profile photo updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let url = `${API}/users/me?name=${encodeURIComponent(editName.trim())}`;
      if (editPhone.trim()) {
        url += `&phone=${encodeURIComponent(editPhone.trim())}`;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setData(prev => ({
        ...prev,
        name: editName.trim(),
        phone: editPhone.trim()
      }));
      setIsEditing(false);
      toast.success('Profile and contact details saved!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/users/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile');
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
  }, [user, token]);

  if (loading) return (
    <PageTransition>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </PageTransition>
  );

  if (error) return (
    <PageTransition>
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState icon={<AlertCircle size={48} className="text-rose-500" />} title="Profile Unavailable" description={error} />
      </div>
    </PageTransition>
  );

  const initials = data?.name
    ? data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <PageHeader 
          title="Account & Profile Settings"
          subtitle="Manage your personal information, emergency contact, and profile avatar."
        />

        {/* Cohesive Profile Card */}
        <div className="card shadow-float border border-gray-100 overflow-hidden bg-white">
          
          {/* Cover Banner */}
          <div className="relative h-44 sm:h-52 bg-gradient-to-r from-[#0B0F2A] via-[#161F55] to-indigo-800 overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute -top-12 -right-12 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Top Right Floating Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/95 backdrop-blur-md border border-white/20 shadow-sm">
                <Sparkles size={13} className="text-primary-300" />
                HPMS Resident
              </span>
            </div>
          </div>

          {/* Profile Header & Avatar Bar */}
          <div className="px-6 sm:px-10 pb-8">
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 mb-8">
              
              {/* Avatar + Main Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                {/* Avatar with Camera upload (only avatar overlaps banner) */}
                <div className="-mt-16 sm:-mt-20 relative group shrink-0">
                  <div className="w-32 h-32 rounded-full p-1 bg-white shadow-xl ring-4 ring-white">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center text-4xl font-black shadow-inner">
                        {initials}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-brand-navy text-white p-2.5 rounded-full shadow-lg ring-2 ring-white hover:bg-primary-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                    title="Upload profile photo"
                  >
                    <Camera size={16} />
                  </button>

                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                  />
                </div>

                {/* Identity Information */}
                <div className="pt-2 sm:pt-0 sm:pb-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight capitalize">
                      {data?.name || 'Verified User'}
                    </h1>
                    <span title="Verified Resident Profile">
                      <CheckCircle2 size={22} className="text-primary-500 fill-primary-50" />
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5 mt-2 justify-center sm:justify-start text-xs">
                    <StatusBadge status={data?.role || 'student'} />
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Mail size={13} className="text-gray-400" />
                      {data?.email || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 w-full sm:w-auto pb-1">
                <button 
                  onClick={() => { 
                    setEditName(data?.name || ''); 
                    setEditPhone(data?.phone || ''); 
                    setIsEditing(true); 
                  }} 
                  className="btn-cta w-full sm:w-auto flex items-center justify-center gap-2 !py-2.5 !px-5 text-sm font-bold shadow-soft hover:shadow-glow transition-all"
                >
                  <Edit3 size={16} />
                  <span>Update Contact Details</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-100 mb-8" />

            {/* Structured Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 transition-all hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Full Legal Name</span>
                    <span className="text-xs text-indigo-600 font-semibold">Official Record</span>
                  </div>
                </div>
                <p className="font-extrabold text-brand-navy text-base mt-2 capitalize">{data?.name || '—'}</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 transition-all hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</span>
                    <span className="text-xs text-amber-700 font-semibold">Primary Contact</span>
                  </div>
                </div>
                <p className="font-extrabold text-brand-navy text-base mt-2 truncate" title={data?.email}>{data?.email || '—'}</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 transition-all hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Mobile Number</span>
                    <span className="text-xs text-emerald-700 font-semibold">Hostel & Emergency</span>
                  </div>
                </div>
                <p className="font-extrabold text-brand-navy text-base mt-2">
                  {data?.phone ? (
                    `+91 ${data.phone}`
                  ) : (
                    <span className="text-amber-600 font-medium text-xs italic">
                      Not provided (Required for gate passes)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Account Status & Security Note */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-navy">Student Account Verified</p>
                  <p className="text-[11px] text-gray-400">Direct booking, online rent dues, and maintenance tickets enabled.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} /> Active Resident
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Edit Modal */}
        <Modal 
          isOpen={isEditing} 
          onClose={() => setIsEditing(false)} 
          title="Update Profile & Contact Details"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Full Legal Name *
              </label>
              <input 
                type="text" 
                className="field-input w-full" 
                value={editName} 
                onChange={e => setEditName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Mobile Phone Number *
              </label>
              <input 
                type="tel" 
                className="field-input w-full" 
                value={editPhone} 
                onChange={e => setEditPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={15}
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Used by property management and wardens for critical notices and emergency alerts.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)} 
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="btn-cta !py-2.5"
              >
                {saving ? 'Saving...' : 'Save Contact Details'}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </PageTransition>
  );
}
