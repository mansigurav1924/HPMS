import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { ShieldCheck, UserCheck, CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { Button, Card, Badge, PageTransition, StaggerList, Skeleton, EmptyState } from '../../components/ui';

const API = import.meta.env.VITE_API_URL;

export default function AdminOwners() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('owners');
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [propStatusFilter, setPropStatusFilter] = useState('Under Review');
  const [rejectReason, setRejectReason] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOwners = () => {
    setLoading(true);
    fetch(`${API}/admin/owners${statusFilter ? `?status=${statusFilter}` : ''}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setOwners(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(e => { setMsg(`Failed to fetch owners`); setLoading(false); });
  };

  const loadProperties = () => {
    setLoading(true);
    fetch(`${API}/admin/properties${propStatusFilter ? `?status=${encodeURIComponent(propStatusFilter)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setProperties(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(e => { setMsg(`Failed to fetch properties`); setLoading(false); });
  };

  useEffect(() => {
    if (activeTab === 'owners') loadOwners();
    else loadProperties();
  }, [activeTab, statusFilter, propStatusFilter]);

  const handleVerifyOwner = (ownerId, action) => {
    const reason = rejectReason[ownerId] || '';
    if (action === 'reject' && !reason.trim()) return alert('Rejection reason is required');
    fetch(`${API}/admin/owners/${ownerId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, reason }),
    }).then(r => r.json()).then(res => { setMsg(res.message || res.detail); loadOwners(); });
  };

  const handleVerifyProperty = (propId, action) => {
    const reason = rejectReason[propId] || '';
    if ((action === 'reject' || action === 'suspend') && !reason.trim()) return alert('Reason is required');
    fetch(`${API}/admin/properties/${propId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, reason }),
    }).then(r => r.json()).then(res => { setMsg(res.message || res.detail); loadProperties(); });
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-extrabold text-brand-navy mb-8 tracking-tight">Admin Moderation & Verification</h1>

        {msg && <div className="mb-6 p-4 bg-brand-sky/20 text-brand-navy rounded-2xl border border-brand-sky font-bold shadow-sm">{msg}</div>}

        <div className="flex gap-2 bg-gray-100 rounded-full p-1 mb-8 w-fit shadow-inner">
          <button className={`px-6 py-2.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'owners' ? 'bg-white text-brand-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('owners')}>
            Owner KYC
          </button>
          <button className={`px-6 py-2.5 text-sm font-bold rounded-full transition-colors ${activeTab === 'properties' ? 'bg-white text-brand-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('properties')}>
            Properties
          </button>
        </div>

        {activeTab === 'owners' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-brand-navy">Owners Review Queue</h2>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pill-select">
                <option value="pending_verification">Pending Verification</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="">All Statuses</option>
              </select>
            </div>

            {loading ? <Skeleton className="h-40 w-full" /> : owners.length === 0 ? (
              <EmptyState icon={<UserCheck size={48} className="text-gray-300"/>} title="Queue is empty" description="No owners found for this filter." />
            ) : (
              <StaggerList className="space-y-4">
                {owners.map(o => (
                  <Card key={o.owner_id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-extrabold text-lg text-brand-navy">{o.business_name || 'No Business Name'}</h3>
                        <p className="text-sm font-semibold text-gray-500 mt-1">{o.name} <span className="text-gray-400">({o.email})</span></p>
                        <Badge className={`mt-3 font-bold uppercase tracking-wider ${o.verification_status === 'approved' ? 'bg-green-100 text-green-700' : o.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {o.verification_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Documents</h4>
                        {o.kyc_signed_urls && Object.keys(o.kyc_signed_urls).length > 0 ? (
                          <div className="space-y-2 flex flex-col items-end">
                            {Object.entries(o.kyc_signed_urls).map(([key, url]) => (
                              <a key={key} href={url} target="_blank" rel="noreferrer" className="text-brand-sky text-sm hover:underline font-bold flex items-center gap-1">
                                {key === 'id_proof' ? 'ID Proof' : 'Ownership Doc'}
                              </a>
                            ))}
                          </div>
                        ) : <p className="text-xs text-gray-400 italic">None uploaded</p>}
                      </div>
                    </div>

                    {o.verification_status === 'pending_verification' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        <input type="text" placeholder="Reason (if rejecting)..." value={rejectReason[o.owner_id] || ''} onChange={e => setRejectReason({ ...rejectReason, [o.owner_id]: e.target.value })} className="flex-1 pill-input !py-2" />
                        <Button className="!px-4 bg-green-500 hover:bg-green-600" onClick={() => handleVerifyOwner(o.owner_id, 'approve')}>Approve</Button>
                        <Button className="!px-4 bg-red-500 hover:bg-red-600" onClick={() => handleVerifyOwner(o.owner_id, 'reject')}>Reject</Button>
                      </div>
                    )}
                  </Card>
                ))}
              </StaggerList>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-brand-navy">Properties Review Queue</h2>
              <select value={propStatusFilter} onChange={(e) => setPropStatusFilter(e.target.value)} className="pill-select">
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Suspended">Suspended</option>
                <option value="">All Statuses</option>
              </select>
            </div>

            {loading ? <Skeleton className="h-40 w-full" /> : properties.length === 0 ? (
              <EmptyState icon={<Building2 size={48} className="text-gray-300"/>} title="Queue is empty" description="No properties found for this filter." />
            ) : (
              <StaggerList className="space-y-4">
                {properties.map(p => (
                  <Card key={p.property_id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-extrabold text-lg text-brand-navy flex items-center gap-2">{p.name} <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase tracking-wider">{p.type.replace('_', ' ')}</span></h3>
                        <p className="text-sm font-semibold text-gray-500 mt-1">{p.city}, {p.address}</p>
                        <p className="text-xs font-bold text-gray-400 mt-1">Owner: {p.owner_name}</p>
                        <Badge className={`mt-3 font-bold uppercase tracking-wider ${p.status === 'Approved' ? 'bg-green-100 text-green-700' : p.status === 'Rejected' ? 'bg-red-100 text-red-700' : p.status === 'Suspended' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <input type="text" placeholder="Reason..." value={rejectReason[p.property_id] || ''} onChange={e => setRejectReason({ ...rejectReason, [p.property_id]: e.target.value })} className="flex-1 pill-input !py-2" />
                      <Button className="!px-4 bg-green-500 hover:bg-green-600" onClick={() => handleVerifyProperty(p.property_id, 'approve')}>Approve</Button>
                      <Button className="!px-4 bg-red-500 hover:bg-red-600" onClick={() => handleVerifyProperty(p.property_id, 'reject')}>Reject</Button>
                      <Button className="!px-4 bg-orange-500 hover:bg-orange-600" onClick={() => handleVerifyProperty(p.property_id, 'suspend')}>Suspend</Button>
                    </div>
                  </Card>
                ))}
              </StaggerList>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
