import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card, Modal, EmptyState } from '../../components/ui';
import { PageHeader, StatusBadge, DataTable } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Star, EyeOff, Eye, ShieldCheck, Filter, Calendar, 
  AlertCircle, MessageSquare
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Moderate modal state
  const [reviewToModerate, setReviewToModerate] = useState(null);
  const [targetStatus, setTargetStatus] = useState('Hidden');
  const [reason, setReason] = useState('');
  const [moderating, setModerating] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (statusFilter) params.append('status', statusFilter);
    if (ratingFilter) params.append('rating', ratingFilter);

    fetch(`${API}/admin/reviews?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then(d => {
        setReviews(d.reviews || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter, ratingFilter, token]);

  const handleModerate = async (e) => {
    e.preventDefault();
    if (!reviewToModerate || !reason.trim()) {
      toast.error('Moderation reason is mandatory.');
      return;
    }

    setModerating(true);
    try {
      const res = await fetch(`${API}/admin/reviews/${reviewToModerate.review_id}/moderate`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: reason.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Moderation failed');
      }

      toast.success(`Review marked as ${targetStatus}.`);
      setReviewToModerate(null);
      setReason('');
      fetchReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModerating(false);
    }
  };

  const columns = [
    {
      key: 'rating',
      header: 'Rating',
      render: (r) => (
        <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
          <Star size={15} className="fill-amber-400" />
          <span>{r.rating}</span>
          <span className="text-xs text-gray-400 font-normal">/ 5</span>
        </div>
      )
    },
    {
      key: 'comment',
      header: 'Review Content',
      render: (r) => (
        <div className="max-w-md py-1">
          <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
            {r.comment || <span className="italic text-gray-400">No written feedback</span>}
          </p>
          {r.owner_reply && (
            <p className="text-[11px] text-primary-700 bg-primary-50 px-2 py-1 rounded-md mt-1.5 truncate">
              <span className="font-bold">Owner Reply: </span>{r.owner_reply}
            </p>
          )}
          {r.status === 'Hidden' && r.hidden_reason && (
            <p className="text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded-md mt-1 truncate">
              <span className="font-bold">Hidden Reason: </span>{r.hidden_reason}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
          r.status === 'Visible' 
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-rose-50 text-rose-700 ring-rose-200'
        }`}>
          {r.status}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Posted Date',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {new Date(r.created_at).toLocaleDateString('en-IN', {
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
      render: (r) => (
        <button
          onClick={() => {
            setReviewToModerate(r);
            setTargetStatus(r.status === 'Visible' ? 'Hidden' : 'Visible');
            setReason(r.hidden_reason || '');
          }}
          className={`btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1.5 ml-auto ${
            r.status === 'Visible' ? 'hover:!text-rose-600' : 'hover:!text-emerald-600'
          }`}
        >
          {r.status === 'Visible' ? (
            <>
              <EyeOff size={13} />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye size={13} />
              <span>Restore</span>
            </>
          )}
        </button>
      )
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Review Moderation & Trust Center"
          subtitle="Audit resident reviews, moderate inappropriate content, and maintain review ecosystem integrity."
        />

        {/* Data Table */}
        <DataTable 
          columns={columns}
          rows={reviews}
          loading={loading}
          rowKey="review_id"
          filters={
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs font-semibold"
                aria-label="Filter reviews by status"
              >
                <option value="">All Visibility</option>
                <option value="Visible">Visible Only</option>
                <option value="Hidden">Hidden (Moderated)</option>
              </select>

              <select
                value={ratingFilter}
                onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
                className="field-input !h-10 text-xs font-semibold"
                aria-label="Filter reviews by star rating"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          }
          server={{
            page,
            pageSize,
            total,
            onPageChange: (p) => setPage(p)
          }}
          emptyTitle="No reviews match your filters"
          emptyDescription="Try selecting a different status or rating filter."
        />

        {/* Moderation Modal */}
        <Modal
          isOpen={Boolean(reviewToModerate)}
          onClose={() => setReviewToModerate(null)}
          title={`${targetStatus === 'Hidden' ? 'Hide' : 'Restore'} Review`}
        >
          <form onSubmit={handleModerate} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-100">
              <span className="font-bold block mb-1">Target Review Content:</span>
              "{reviewToModerate?.comment || 'Rating: ' + reviewToModerate?.rating + '/5'}"
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Moderation Justification *
              </label>
              <textarea
                rows={3}
                placeholder="State the reason (e.g. Contains offensive language, spam, or PII)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="field-input w-full !h-auto py-2.5 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReviewToModerate(null)}
                className="btn-secondary"
                disabled={moderating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={targetStatus === 'Hidden' ? 'btn-danger !py-2.5' : 'btn-cta !py-2.5'}
                disabled={moderating}
              >
                {moderating ? 'Processing...' : `Confirm Set to ${targetStatus}`}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </PageTransition>
  );
}
