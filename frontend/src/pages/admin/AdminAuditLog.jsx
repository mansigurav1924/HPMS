import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card, Modal, EmptyState } from '../../components/ui';
import { PageHeader, StatusBadge, DataTable } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  FileText, Download, ShieldCheck, Filter, Calendar, 
  Eye, RefreshCw, Clock, User
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminAuditLog() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  // Inspector modal state
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (roleFilter) params.append('role', roleFilter);
    if (actionFilter) params.append('action', actionFilter);
    if (entityFilter) params.append('entity_type', entityFilter);

    fetch(`${API}/admin/audit-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load audit logs');
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
  }, [page, roleFilter, actionFilter, entityFilter, token]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ export: 'true' });
      if (roleFilter) params.append('role', roleFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity_type', entityFilter);

      const res = await fetch(`${API}/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Audit log CSV downloaded.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (r) => (
        <div className="text-xs">
          <p className="font-bold text-brand-navy">
            {new Date(r.timestamp).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
          <p className="text-gray-400 font-medium">
            {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Actor & Role',
      render: (r) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={r.role || 'system'} />
          <span className="text-xs font-mono text-gray-500 truncate max-w-[100px]" title={r.actor_id || r.user_id}>
            {r.actor_id ? String(r.actor_id).substring(0, 8) + '…' : 'System'}
          </span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <span className="font-bold text-xs uppercase tracking-wider text-brand-navy bg-gray-100 px-2.5 py-1 rounded-md">
          {r.action}
        </span>
      )
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (r) => (
        <div className="text-xs">
          <span className="font-bold text-primary-700 capitalize">{r.entity_type}</span>
          {r.entity_id && (
            <span className="text-gray-400 font-mono block text-[11px] truncate max-w-[130px]">
              ID: {r.entity_id}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'inspect',
      header: '',
      className: 'text-right',
      render: (r) => (
        <button
          onClick={() => setSelectedLog(r)}
          className="btn-light-circle !w-8 !h-8 text-gray-400 hover:text-brand-navy"
          title="Inspect log payload"
        >
          <Eye size={15} />
        </button>
      )
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="System Audit Trail & Security Logs"
          subtitle="Immutable chronological ledger of administrative mutations, auth events, and entity lifecycles."
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="btn-secondary flex items-center gap-2 !py-2.5"
              >
                <Download size={16} />
                <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="btn-light-circle !w-10 !h-10 border border-gray-200"
                title="Refresh log feed"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          }
        />

        {/* Audit Log Table */}
        <DataTable 
          columns={columns}
          rows={logs}
          loading={loading}
          rowKey="log_id"
          filters={
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs font-semibold"
                aria-label="Filter by actor role"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="student">Student</option>
                <option value="warden">Warden</option>
              </select>

              <input
                type="text"
                placeholder="Filter by action (e.g. UPDATE)"
                value={actionFilter}
                onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs w-48"
              />

              <input
                type="text"
                placeholder="Entity type (e.g. properties)"
                value={entityFilter}
                onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs w-44"
              />
            </div>
          }
          server={{
            page,
            pageSize,
            total,
            onPageChange: (p) => setPage(p)
          }}
          emptyTitle="No audit records found"
          emptyDescription="No events match the selected filters."
        />

        {/* Log Details Modal */}
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Record Details"
        >
          {selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Action</span>
                  <span className="font-extrabold text-brand-navy text-sm">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Timestamp</span>
                  <span className="font-bold text-gray-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Actor Role</span>
                  <StatusBadge status={selectedLog.role} />
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Entity Type</span>
                  <span className="font-bold text-brand-navy uppercase">{selectedLog.entity_type}</span>
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-1">Previous State (Before Mutation):</h4>
                  <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-40">
                    {typeof selectedLog.old_data === 'object' ? JSON.stringify(selectedLog.old_data, null, 2) : selectedLog.old_data}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <h4 className="font-bold text-gray-700 mb-1">Applied Changes (After Mutation):</h4>
                  <pre className="p-3 bg-gray-900 text-sky-300 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-40">
                    {typeof selectedLog.new_data === 'object' ? JSON.stringify(selectedLog.new_data, null, 2) : selectedLog.new_data}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="btn-secondary !py-2 !px-4"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </PageTransition>
  );
}
