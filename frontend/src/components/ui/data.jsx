import React, { useEffect, useMemo, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Card, Modal, Skeleton, EmptyState } from './index';

/* ───────────── Animated counter ───────────── */
export function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, duration = 0.9 }) {
  const reduce = useReducedMotion();
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [target, duration, reduce]);

  const text = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ───────────── Stat widget ───────────── */
const TONES = {
  indigo: 'bg-primary-50 text-primary-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
};

export function StatCard({ label, value, icon, tone = 'indigo', prefix, suffix, decimals, hint, index = 0 }) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.4), ease: 'easeOut' }}
      className="card card-hover p-5 flex items-center gap-4 h-full"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${TONES[tone] || TONES.indigo}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-extrabold text-brand-navy leading-tight">
          {typeof value === 'number' ? (
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          ) : (
            value ?? '—'
          )}
        </p>
        {hint && <p className="text-xs text-gray-500 mt-0.5 truncate">{hint}</p>}
      </div>
    </motion.div>
  );
  return body;
}

/* ───────────── Status badge ───────────── */
const STATUS_STYLES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  indigo: 'bg-primary-50 text-primary-700 ring-primary-200',
  gray: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const STATUS_MAP = {
  active: 'green', approved: 'green', confirmed: 'green', verified: 'green', resolved: 'green',
  success: 'green', paid: 'green', delivered: 'green', sent: 'green', checked_in: 'green',
  pending: 'amber', requested: 'amber', 'pending verification': 'amber', 'pending approval': 'amber',
  open: 'amber', in_progress: 'amber', notice: 'amber', flagged: 'amber', queued: 'amber', reserved: 'amber',
  rejected: 'red', suspended: 'red', cancelled: 'red', inactive: 'red', failed: 'red', bounced: 'red',
  expired: 'red', no_show: 'red', escalated: 'red',
  acknowledged: 'blue', closed: 'gray', completed: 'gray', ended: 'gray',
};

export function StatusBadge({ status, className = '' }) {
  const key = String(status ?? '').toLowerCase();
  const tone = STATUS_MAP[key] || 'indigo';
  const label = String(status ?? '—').replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[tone]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

/* ───────────── Page header ───────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm md:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ───────────── Avatar ───────────── */
export function Avatar({ name = '?', size = 36, className = '' }) {
  const initials = String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
}

/* ───────────── Confirm dialog ───────────── */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
  children,
}) {
  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={title}>
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      {children}
      <div className="flex justify-end gap-3 mt-6">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className={tone === 'danger' ? 'btn-danger' : 'btn-cta !py-2.5'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ───────────── Data table ───────────── */
/**
 * Client-side searchable + paginated table.
 * columns: [{ key, header, render?(row), className?, sortValue? }]
 * searchKeys: row fields included in text search.
 * filters: optional ReactNode rendered next to the search box.
 */
export function DataTable({
  columns,
  rows,
  loading = false,
  rowKey,
  searchKeys = [],
  searchPlaceholder = 'Search…',
  filters,
  toolbarRight,
  pageSize = 10,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'There are no records to display.',
  // Server mode: { page, total, pageSize, onPageChange, query, onQueryChange }
  server,
}) {
  const [clientQuery, setClientQuery] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const isServer = Boolean(server);

  const query = isServer ? server.query ?? '' : clientQuery;
  const setQuery = isServer ? server.onQueryChange : setClientQuery;
  const hasSearch = isServer ? Boolean(server.onQueryChange) : searchKeys.length > 0;
  const size = isServer ? server.pageSize : pageSize;

  const filtered = useMemo(() => {
    if (isServer) return rows || [];
    const q = clientQuery.trim().toLowerCase();
    if (!q || !searchKeys.length) return rows || [];
    return (rows || []).filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, clientQuery, isServer]);

  const total = isServer ? server.total || 0 : filtered.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const page = isServer ? server.page : clientPage;
  const goTo = (p) => {
    const next = Math.min(pages, Math.max(1, p));
    if (isServer) server.onPageChange(next);
    else setClientPage(next);
  };

  useEffect(() => {
    if (!isServer && clientPage > pages) setClientPage(pages);
  }, [pages, clientPage, isServer]);
  useEffect(() => setClientPage(1), [clientQuery]);

  const slice = isServer ? filtered : filtered.slice((page - 1) * size, page * size);

  return (
    <Card className="p-0">
      {(hasSearch || filters || toolbarRight) && (
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {hasSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label="Search table"
                  className="field-input !h-10 !pl-10"
                />
              </div>
            )}
            {filters}
          </div>
          {toolbarRight}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`th-cell ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="td-cell">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              slice.map((row, i) => (
                <motion.tr
                  key={rowKey ? row[rowKey] : i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.025, 0.2) }}
                  className="hover:bg-primary-50/40 transition-colors"
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`td-cell ${c.className || ''}`}>
                      {c.render ? c.render(row) : row[c.key] ?? '—'}
                    </td>
                  ))}
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && slice.length === 0 && (
        <EmptyState
          icon={<Inbox size={44} className="text-gray-300" />}
          title={emptyTitle}
          description={query ? 'No results match your search.' : emptyDescription}
        />
      )}

      {!loading && slice.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-light-circle !w-8 !h-8"
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-700 tabular-nums">
              {page} / {pages}
            </span>
            <button
              className="btn-light-circle !w-8 !h-8"
              onClick={() => goTo(page + 1)}
              disabled={page === pages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ───────────── Simple loading / error blocks ───────────── */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
