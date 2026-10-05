import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function OwnerKYC() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [authDoc, setAuthDoc] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/owners/me/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setProfile(d))
      .catch(() => {});
  }, [token]);

  const statusColor = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    'Pending Verification': 'bg-yellow-100 text-yellow-800',
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!idProof || !authDoc) return setMsg('Please select both files.');
    setLoading(true);
    const fd = new FormData();
    fd.append('id_proof', idProof);
    fd.append('auth_doc', authDoc);
    const res = await fetch(`${API}/owners/kyc`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    setMsg(res.ok ? '✅ ' + data.message : '❌ ' + (data.detail || 'Upload failed'));
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">KYC Verification</h1>

      {/* Status Banner */}
      {profile && (
        <div className={`mb-6 p-4 rounded-lg font-semibold ${statusColor[profile.verification_status] || 'bg-gray-100'}`}>
          Status: <span className="uppercase">{profile.verification_status}</span>
          {profile.rejection_reason && (
            <p className="mt-1 text-sm font-normal">Reason: {profile.rejection_reason}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
        <p className="text-sm text-gray-500 mb-4">
          Accepted: JPG, PNG, WEBP, PDF · Max 5 MB each · Never share ID numbers in file names.
        </p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Aadhaar / PAN / Passport)</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={e => setIdProof(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Ownership / Authorization Document</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={e => setAuthDoc(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          {msg && <p className={`text-sm ${msg.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}
          <button type="submit" disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-700 transition disabled:opacity-50 self-start">
            {loading ? 'Uploading…' : 'Submit KYC'}
          </button>
        </form>
      </div>
    </div>
  );
}
