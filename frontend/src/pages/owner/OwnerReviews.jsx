import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Modal } from '../../components/ui';
import { PageHeader, StatCard, Avatar, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Star, MessageCircle, Reply, Building2, Calendar, Search, 
  CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function OwnerReviews() {
  const { user, token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('all');

  // Reply state
  const [replyReview, setReplyReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Load owner's properties
  useEffect(() => {
    fetch(`${API}/properties/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setProperties(list);
        if (list.length > 0) {
          setSelectedProperty(list[0].property_id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Load reviews when selected property changes
  const loadReviews = () => {
    if (!selectedProperty) return;
    setLoading(true);
    fetch(`${API}/properties/${selectedProperty}/reviews?page_size=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load reviews');
        return r.json();
      })
      .then(d => {
        setReviews(d.reviews || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReviews();
  }, [selectedProperty, token]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyReview || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`${API}/reviews/${replyReview.review_id}/reply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ owner_reply: replyText.trim() })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to submit response');
      }

      toast.success('Reply submitted successfully!');
      setReplyReview(null);
      setReplyText('');
      loadReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (ratingFilter === 'all') return true;
    return r.rating === parseInt(ratingFilter, 10);
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const unrepliedCount = reviews.filter(r => !r.owner_reply).length;

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <PageHeader 
          title="Tenant Reviews & Reputation"
          subtitle="Respond to student feedback and maintain high ratings across your properties."
          actions={
            <div className="flex items-center gap-3">
              <select
                value={selectedProperty}
                onChange={e => setSelectedProperty(e.target.value)}
                className="field-input font-medium text-sm sm:w-64"
                aria-label="Filter reviews by property"
              >
                {properties.map(p => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard 
            label="Average Rating"
            value={parseFloat(avgRating) || 0}
            suffix=" / 5.0"
            decimals={1}
            tone="amber"
            icon={<Star size={22} className="fill-amber-400 text-amber-500" />}
            hint={`Calculated from ${reviews.length} tenant reviews`}
            index={0}
          />

          <StatCard 
            label="Total Reviews"
            value={reviews.length}
            tone="indigo"
            icon={<MessageCircle size={22} />}
            hint="Verified resident reviews"
            index={1}
          />

          <StatCard 
            label="Awaiting Your Response"
            value={unrepliedCount}
            tone={unrepliedCount > 0 ? "rose" : "emerald"}
            icon={<Reply size={22} />}
            hint={unrepliedCount > 0 ? "Immediate response recommended" : "All reviews responded to"}
            index={2}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter Stars:</span>
            {['all', '5', '4', '3', '2', '1'].map(stars => (
              <button
                key={stars}
                onClick={() => setRatingFilter(stars)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  ratingFilter === stars 
                    ? 'bg-brand-navy text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {stars === 'all' ? 'All Ratings' : `★ ${stars}`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <EmptyState 
            icon={<Star size={48} className="text-gray-300" />}
            title="No reviews yet"
            description="Students who stay at this property will be invited to leave a verified review upon checkout."
          />
        ) : (
          <div className="space-y-4">
            {filteredReviews.map(r => (
              <Card key={r.review_id} className="p-6 hover:shadow-float transition-all space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.student_name || 'Resident'} size={42} />
                    <div>
                      <h4 className="font-extrabold text-brand-navy text-base">{r.student_name}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={12} />
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                    <span className="font-extrabold text-amber-900 text-sm">{r.rating}</span>
                    <span className="text-xs text-amber-600">/ 5</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed pl-1">
                  {r.comment || <span className="italic text-gray-400">Tenant left a rating without a comment.</span>}
                </p>

                {/* Owner Reply */}
                {r.owner_reply ? (
                  <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-extrabold text-primary-700">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        Management Response
                      </span>
                      <button
                        onClick={() => {
                          setReplyReview(r);
                          setReplyText(r.owner_reply);
                        }}
                        className="text-primary-600 hover:underline font-semibold"
                      >
                        Edit Reply
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {r.owner_reply}
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setReplyReview(r);
                        setReplyText('');
                      }}
                      className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
                    >
                      <Reply size={14} />
                      <span>Respond to Tenant</span>
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        <Modal 
          isOpen={Boolean(replyReview)}
          onClose={() => setReplyReview(null)}
          title={`Respond to ${replyReview?.student_name || 'Resident'}`}
        >
          <form onSubmit={handleSendReply} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100">
              <span className="font-bold block mb-1">Student Review:</span>
              "{replyReview?.comment || 'Rating: ' + replyReview?.rating + '/5'}"
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Your Public Response *
              </label>
              <textarea 
                rows={4}
                placeholder="Thank the student for their feedback and address any concerns professionally..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                maxLength={1000}
                className="field-input w-full !h-auto py-2.5 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReplyReview(null)}
                className="btn-secondary"
                disabled={submittingReply}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cta !py-2.5"
                disabled={submittingReply}
              >
                {submittingReply ? 'Sending...' : 'Post Response'}
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </PageTransition>
  );
}
