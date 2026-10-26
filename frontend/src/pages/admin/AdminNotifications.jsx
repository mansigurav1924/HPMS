import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card, EmptyState } from '../../components/ui';
import { PageHeader, StatusBadge, DataTable } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Bell, Mail, RefreshCw, Send, AlertCircle, CheckCircle2, 
  RotateCcw, ShieldCheck, Filter
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminNotifications() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (statusFilter) params.append('status', statusFilter);
    if (templateFilter) params.append('template', templateFilter);

    fetch(`${API}/admin/notifications?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load notification logs');
        return res.json();
      })
      .then(d => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, templateFilter, token]);

  const handleRetry = async (logId) => {
    setRetryingId(logId);
    try {
      const res = await fetch(`${API}/admin/notifications/${logId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to retry notification');
      }

      toast.success('Notification queued for redelivery.');
      fetchLogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const columns = [
    {
      key: 'destination',
      header: 'Recipient',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
            <Mail size={14} />
          </div>
          <div>
            <p className="font-bold text-xs text-brand-navy">{r.destination}</p>
            <p className="text-[11px] text-gray-400 font-mono">ID: {r.recipient_id ? String(r.recipient_id).substring(0, 8) + '…' : '—'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'template_id',
      header: 'Template / Topic',
      render: (r) => (
        <span className="font-semibold text-xs text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
          {r.template_id || 'System Notification'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Delivery State',
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      key: 'sent_at',
      header: 'Dispatch Timestamp',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {r.sent_at ? new Date(r.sent_at).toLocaleString() : 'Queued'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => {
        if (r.status === 'failed' || r.status === 'bounced') {
          return (
            <button
              onClick={() => handleRetry(r.log_id)}
              disabled={retryingId === r.log_id}
              className="btn-secondary !py-1 !px-2.5 !text-xs flex items-center gap-1 ml-auto text-amber-700 hover:text-amber-800"
            >
              <RotateCcw size={12} className={retryingId === r.log_id ? 'animate-spin' : ''} />
              <span>Retry</span>
            </button>
          );
        }
        return null;
      }
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Notification Dispatch & Delivery Logs"
          subtitle="Real-time multi-channel messaging audit trail, bounce logs, and delivery confirmations."
          actions={
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="btn-light-circle !w-10 !h-10 border border-gray-200"
              title="Refresh logs"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* Data Table */}
        <DataTable 
          columns={columns}
          rows={logs}
          loading={loading}
          rowKey="log_id"
          filters={
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs font-semibold"
                aria-label="Filter notifications by delivery status"
              >
                <option value="">All Delivery States</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
                <option value="queued">Queued</option>
              </select>

              <input
                type="text"
                placeholder="Filter by template ID"
                value={templateFilter}
                onChange={e => { setTemplateFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs w-48"
              />
            </div>
          }
          server={{
            page,
            pageSize,
            total,
            onPageChange: (p) => setPage(p)
          }}
          emptyTitle="No notification dispatches found"
          emptyDescription="Delivered emails and push alerts will be logged here."
        />

      </div>
    </PageTransition>
  );
}
