import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { 
  Star, MessageCircle, Building2, Calendar, ShieldCheck, 
  Sparkles, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function ReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/reviews/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then(d => {
        setReviews(d.reviews || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="My Verified Reviews"
          subtitle="Your reviews and ratings for accommodations you've resided in."
          actions={
            <Link to="/student/stay" className="btn-secondary !py-2.5 !text-xs font-bold">
              View Current Stay
            </Link>
          }
        />

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map(i => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState 
            icon={<Star size={48} className="text-rose-500" />}
            title="Failed to load reviews"
            description={error}
          />
        ) : reviews.length === 0 ? (
          <EmptyState 
            icon={<Star size={48} className="text-gray-300" />}
            title="No Reviews Submitted Yet"
            description="After completing a stay or checkout from a verified hostel or PG, you will be invited to leave a review."
          />
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <Card key={r.review_id} className="p-6 hover:shadow-float transition-all space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-extrabold text-brand-navy text-base flex items-center gap-2">
                      <Building2 size={16} className="text-primary-600" />
                      <span>{r.property_name || 'Hostel / PG Residence'}</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <Calendar size={12} />
                      Reviewed on {new Date(r.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                    <span className="font-extrabold text-amber-900 text-sm">{r.rating}</span>
                    <span className="text-xs text-amber-600">/ 5</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed pl-1">
                  {r.comment || <span className="italic text-gray-400">Rating left without written comment.</span>}
                </p>

                {r.owner_reply && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary-700">
                      <ShieldCheck size={14} />
                      Management Response
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {r.owner_reply}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

      </div>
    </PageTransition>
  );
}
