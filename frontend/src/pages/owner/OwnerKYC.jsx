import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button, Card, Badge, PageTransition, EmptyState } from '../../components/ui';

const API = import.meta.env.VITE_API_URL;

export default function OwnerKYC() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [authDoc, setAuthDoc] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/owners/me/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setProfile(d)).catch(() => {});
  }, [token]);

  const statusColor = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    pending_verification: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Pending Verification': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!idProof || !authDoc) return setMsg('Please select both files.');
    setLoading(true);
    const fd = new FormData(); fd.append('id_proof', idProof); fd.append('auth_doc', authDoc);
    const res = await fetch(`${API}/owners/kyc`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json();
    setMsg(res.ok ? '✅ ' + data.message : '❌ ' + (data.detail || 'Upload failed'));
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-extrabold text-brand-navy mb-8 tracking-tight">KYC Verification</h1>

        {profile && profile.verification_status !== 'unverified' && (
          <Card className={`mb-8 border ${statusColor[profile.verification_status] || 'bg-gray-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              {profile.verification_status === 'approved' ? <CheckCircle2 className="text-green-600"/> : <AlertCircle className="text-yellow-600"/>}
              <h3 className="font-extrabold text-lg uppercase tracking-wider">{profile.verification_status.replace('_', ' ')}</h3>
            </div>
            {profile.rejection_reason && <p className="text-sm font-semibold opacity-80">Reason: {profile.rejection_reason}</p>}
          </Card>
        )}

        <Card className="p-8">
          <div className="mb-6 border-b border-gray-100 pb-6">
            <h2 className="text-xl font-extrabold text-brand-navy mb-2">Upload Documents</h2>
            <p className="text-sm font-medium text-gray-500">
              Accepted formats: JPG, PNG, WEBP, PDF (Max 5MB each). Please ensure documents are clear and legible.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 border-dashed relative group">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                ID Proof (Aadhaar / PAN / Passport)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-sky shadow-sm">
                  <FileText size={20} />
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setIdProof(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-white file:text-brand-navy file:shadow-sm hover:file:bg-gray-50 transition-colors" />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 border-dashed relative group">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Property Ownership / Authorization Document
              </label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-orange shadow-sm">
                  <FileText size={20} />
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setAuthDoc(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-white file:text-brand-navy file:shadow-sm hover:file:bg-gray-50 transition-colors" />
              </div>
            </div>

            {msg && <p className={`text-sm font-bold p-4 rounded-xl ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</p>}

            <Button type="submit" disabled={loading} className="w-full mt-2 gap-2">
              <UploadCloud size={18} /> {loading ? 'Uploading…' : 'Submit Documents'}
            </Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
