import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const API = import.meta.env.VITE_API_URL;

export default function AdminOwners() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('owners'); // 'owners' | 'properties'
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [propStatusFilter, setPropStatusFilter] = useState('Under Review');
  const [rejectReason, setRejectReason] = useState({});
  const [msg, setMsg] = useState('');

  const loadOwners = () => {
    const query = statusFilter ? `?status=${statusFilter}` : '';
    fetch(`${API}/admin/owners${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOwners(Array.isArray(data) ? data : []))
      .catch((e) => setMsg(`Failed to fetch owners: ${e}`));
  };

  const loadProperties = () => {
    const query = propStatusFilter ? `?status=${encodeURIComponent(propStatusFilter)}` : '';
    fetch(`${API}/admin/properties${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setProperties(Array.isArray(data) ? data : []))
      .catch((e) => setMsg(`Failed to fetch properties: ${e}`));
  };

  useEffect(() => {
    if (activeTab === 'owners') loadOwners();
    else loadProperties();
  }, [activeTab, statusFilter, propStatusFilter]);

  const handleVerifyOwner = (ownerId, action) => {
    const reason = rejectReason[ownerId] || '';
    if (action === 'reject' && !reason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    fetch(`${API}/admin/owners/${ownerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, reason }),
    })
      .then((r) => r.json())
      .then((res) => {
        setMsg(res.message || res.detail);
        loadOwners();
      });
  };

  const handleVerifyProperty = (propId, action) => {
    const reason = rejectReason[propId] || '';
    if ((action === 'reject' || action === 'suspend') && !reason.trim()) {
      alert('Reason is required for reject/suspend');
      return;
    }
    fetch(`${API}/admin/properties/${propId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, reason }),
    })
      .then((r) => r.json())
      .then((res) => {
        setMsg(res.message || res.detail);
        loadProperties();
      });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Moderation & Verification</h1>

      {msg && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-semibold ${
            activeTab === 'owners'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('owners')}
        >
          Owner KYC Verification
        </button>
        <button
          className={`py-2 px-4 font-semibold ${
            activeTab === 'properties'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('properties')}
        >
          Property Verification
        </button>
      </div>

      {activeTab === 'owners' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Owners Review Queue</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="pending_verification">Pending Verification</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All Statuses</option>
            </select>
          </div>

          {owners.length === 0 ? (
            <p className="text-gray-500 italic">No owners found for this filter.</p>
          ) : (
            <div className="grid gap-4">
              {owners.map((o) => (
                <div key={o.owner_id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{o.business_name || 'No Business Name'}</h3>
                      <p className="text-sm text-gray-600">Owner Name: {o.name} ({o.email})</p>
                      <p className="text-sm text-gray-600">Phone: {o.phone || 'N/A'}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                        o.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                        o.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {o.verification_status}
                      </span>
                    </div>

                    {/* KYC Documents Links */}
                    <div className="text-right">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Submitted Documents:</h4>
                      {o.kyc_signed_urls && Object.keys(o.kyc_signed_urls).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(o.kyc_signed_urls).map(([key, url]) => (
                            <div key={key}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 text-sm hover:underline font-medium"
                              >
                                View {key === 'id_proof' ? 'ID Proof' : 'Ownership Doc'}
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No docs uploaded</p>
                      )}
                    </div>
                  </div>

                  {o.verification_status === 'pending_verification' && (
                    <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason (if rejecting)..."
                        value={rejectReason[o.owner_id] || ''}
                        onChange={(e) => setRejectReason({ ...rejectReason, [o.owner_id]: e.target.value })}
                        className="border p-2 rounded text-sm w-full"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerifyOwner(o.owner_id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded text-sm transition"
                        >
                          Approve Owner
                        </button>
                        <button
                          onClick={() => handleVerifyOwner(o.owner_id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded text-sm transition"
                        >
                          Reject Owner
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Properties Review Queue</h2>
            <select
              value={propStatusFilter}
              onChange={(e) => setPropStatusFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
              <option value="">All Statuses</option>
            </select>
          </div>

          {properties.length === 0 ? (
            <p className="text-gray-500 italic">No properties found for this filter.</p>
          ) : (
            <div className="grid gap-4">
              {properties.map((p) => (
                <div key={p.property_id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{p.name} ({p.type})</h3>
                      <p className="text-sm text-gray-600">Location: {p.city}, {p.address}</p>
                      <p className="text-sm text-gray-600">Owner: {p.owner_name} ({p.owner_email})</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                        p.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        p.status === 'Suspended' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Reason for reject / suspend..."
                      value={rejectReason[p.property_id] || ''}
                      onChange={(e) => setRejectReason({ ...rejectReason, [p.property_id]: e.target.value })}
                      className="border p-2 rounded text-sm w-full"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerifyProperty(p.property_id, 'approve')}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded text-sm transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerifyProperty(p.property_id, 'reject')}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded text-sm transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleVerifyProperty(p.property_id, 'suspend')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded text-sm transition"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
