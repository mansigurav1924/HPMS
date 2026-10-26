import React, { useCallback, useEffect, useState } from 'react';
import { UserX, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { apiFetch, formatDate } from '../../lib/api';
import {
  PageTransition, PageHeader, DataTable, StatusBadge, Avatar, ConfirmDialog, PillSelect, EmptyState, Button, toast,
} from '../../components/ui';

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState(null); // { user, action }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page, page_size: PAGE_SIZE });
    if (debounced) qs.set('search', debounced);
    if (role) qs.set('role', role);
    if (status) qs.set('status', status);
    apiFetch('/admin/users?' + qs.toString(), token)
      .then((d) => {
        setRows(d.users || []);
        setTotal(d.total || 0);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, debounced, role, status, token]);

  useEffect(load, [load]);

  const confirmAction = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${target.user.user_id}/${target.action}`, token, { method: 'POST' });
      toast.success(`${target.user.name} ${target.action === 'deactivate' ? 'deactivated' : 'activated'}`);
      setTarget(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size={36} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{u.name}</p>
            <p className="text-xs text-gray-500 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Mobile', render: (u) => u.phone || '—' },
    { key: 'role', header: 'Role', render: (u) => <span className="capitalize font-medium">{u.role}</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    { key: 'created_at', header: 'Joined', render: (u) => formatDate(u.created_at) },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => {
        const isSelf = String(u.user_id) === String(me?.id);
        if (isSelf) return <span className="text-xs text-gray-400">You</span>;
        return u.status === 'inactive' ? (
          <Button variant="secondary" className="!py-1.5 !px-3 text-xs" onClick={() => setTarget({ user: u, action: 'activate' })}>
            <UserCheck size={14} /> Activate
          </Button>
        ) : (
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
            onClick={() => setTarget({ user: u, action: 'deactivate' })}
          >
            <UserX size={14} /> Deactivate
          </button>
        );
      },
    },
  ];

  if (error && !rows.length)
    return (
      <PageTransition>
        <EmptyState
          icon={<AlertCircle size={44} className="text-rose-400" />}
          title="Couldn't load users"
          description={error}
          action={<Button onClick={load}>Try again</Button>}
        />
      </PageTransition>
    );

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Users" subtitle="Search, filter and manage every account on the platform." />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="user_id"
          loading={loading}
          searchPlaceholder="Search by name or email…"
          emptyTitle="No users found"
          server={{
            page, total, pageSize: PAGE_SIZE, onPageChange: setPage, query, onQueryChange: setQuery,
          }}
          filters={
            <div className="flex gap-2">
              <PillSelect value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
                <option value="">All roles</option>
                <option value="student">Students</option>
                <option value="owner">Owners</option>
                <option value="warden">Wardens</option>
                <option value="admin">Admins</option>
              </PillSelect>
              <PillSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </PillSelect>
            </div>
          }
        />
      </div>

      <ConfirmDialog
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmAction}
        loading={busy}
        tone={target?.action === 'deactivate' ? 'danger' : 'primary'}
        title={target?.action === 'deactivate' ? 'Deactivate user?' : 'Activate user?'}
        description={
          target
            ? target.action === 'deactivate'
              ? `${target.user.name} will no longer be able to use their account until reactivated.`
              : `${target.user.name} will regain access to their account.`
            : ''
        }
        confirmLabel={target?.action === 'deactivate' ? 'Deactivate' : 'Activate'}
      />
    </PageTransition>
  );
}
