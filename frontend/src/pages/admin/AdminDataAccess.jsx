import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card, Modal, EmptyState } from '../../components/ui';
import { PageHeader, StatusBadge, DataTable, ConfirmDialog } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  ShieldCheck, UserX, Download, CheckCircle2, XCircle, 
  Clock, AlertTriangle, FileText
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminDataAccess() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fulfill confirmation state
  const [requestToFulfill, setRequestToFulfill] = useState(null);
  const [fulfilling, setFulfilling] = useState(false);

  // Reject modal state
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    fetch(`${API}/data-access-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load data access requests');
        return res.json();
      })
      .then(d => {
        setRequests(d.data || []);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleFulfill = async () => {
    if (!requestToFulfill) return;
    setFulfilling(true);
    try {
      const res = await fetch(`${API}/data-access-requests/${requestToFulfill.request_id}/fulfill`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Fulfillment failed');
      }

      toast.success(
        requestToFulfill.request_type === 'Erasure'
          ? 'User record erased and anonymized.'
          : 'Data export fulfilled successfully.'
      );
      setRequestToFulfill(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFulfilling(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!requestToReject || !rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    setRejecting(true);
    try {
      const res = await fetch(`${API}/data-access-requests/${requestToReject.request_id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to reject request');
      }

      toast.success('Request rejected.');
      setRequestToReject(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejecting(false);
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Request Type',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.request_type === 'Erasure' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
              <UserX size={13} />
              Right to Erasure (Delete)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200">
              <FileText size={13} />
              Subject Access Request (Export)
            </span>
          )}
        </div>
      )
    },
    {
      key: 'user_id',
      header: 'User Identifier',
      render: (r) => (
        <span className="font-mono text-xs text-gray-700 font-semibold" title={r.user_id}>
          {String(r.user_id).substring(0, 16)}…
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      key: 'requested_at',
      header: 'Submission Date',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {new Date(r.requested_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => {
        if (r.status === 'Pending') {
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRequestToFulfill(r)}
                className="btn-cta !py-1.5 !px-3 !text-xs"
              >
                Fulfill
              </button>
              <button
                onClick={() => {
                  setRequestToReject(r);
                  setRejectionReason('');
                }}
                className="btn-danger !py-1.5 !px-3 !text-xs"
              >
                Reject
              </button>
            </div>
          );
        }
        if (r.status === 'Rejected' && r.rejection_reason) {
          return (
            <span className="text-xs text-rose-600 font-medium" title={r.rejection_reason}>
              Reason: {r.rejection_reason.substring(0, 24)}…
            </span>
          );
        }
        if (r.status === 'Fulfilled' && r.export_file_url) {
          return (
            <a
              href={r.export_file_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 text-xs font-bold hover:underline inline-flex items-center gap-1"
            >
              <Download size={13} /> Export File
            </a>
          );
        }
        return <span className="text-xs text-gray-400">Completed</span>;
      }
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Privacy & Data Access Requests"
          subtitle="GDPR and DPDP compliance console for executing Subject Access Requests and Right to Erasure."
        />

        {/* Data Table */}
        <DataTable 
          columns={columns}
          rows={requests}
          loading={loading}
          rowKey="request_id"
          emptyTitle="No data access requests"
          emptyDescription="When users submit data privacy requests, they will appear in this compliance queue."
        />

        {/* Fulfill Confirmation */}
        <ConfirmDialog 
          isOpen={Boolean(requestToFulfill)}
          onClose={() => setRequestToFulfill(null)}
          onConfirm={handleFulfill}
          title={requestToFulfill?.request_type === 'Erasure' ? "Execute User Erasure?" : "Fulfill Data Access Export?"}
          description={
            requestToFulfill?.request_type === 'Erasure'
              ? "WARNING: Executing Right to Erasure will permanently anonymize the user's personal identifiers, delete their session credentials, and detach their booking history in accordance with data protection mandates."
              : "This will compile an authenticated JSON archive of all personal records and generate a secure download link for the applicant."
          }
          confirmLabel={requestToFulfill?.request_type === 'Erasure' ? "Confirm Erasure" : "Fulfill Request"}
          tone={requestToFulfill?.request_type === 'Erasure' ? "danger" : "primary"}
          loading={fulfilling}
        />

        {/* Reject Modal */}
        <Modal
          isOpen={Boolean(requestToReject)}
          onClose={() => setRequestToReject(null)}
          title="Reject Privacy Request"
        >
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-xs text-gray-500">
              Provide a valid legal basis or justification for refusing this data subject request.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Rejection Justification *
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Active statutory tenancy agreement requires record retention under local law..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="field-input w-full !h-auto py-2.5 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRequestToReject(null)}
                className="btn-secondary"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger !py-2.5"
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </PageTransition>
  );
}
