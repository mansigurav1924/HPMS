import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card, EmptyState, Skeleton } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Copy, CheckCircle2, XCircle, AlertTriangle, Building2, 
  ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminDuplicates() {
  const { token } = useAuth();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchDuplicates = () => {
    setLoading(true);
    fetch(`${API}/admin/duplicates`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load duplicate queue');
        return res.json();
      })
      .then(d => {
        setFlags(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDuplicates();
  }, [token]);

  const handleResolve = async (flagId, resolution) => {
    setResolvingId(flagId);
    try {
      const res = await fetch(`${API}/admin/duplicates/${flagId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to resolve duplicate');
      }

      toast.success(
        resolution === 'marked_duplicate'
          ? 'Property flagged as duplicate successfully.'
          : 'Flag dismissed. Properties kept separate.'
      );
      fetchDuplicates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Duplicate Property Detection Queue"
          subtitle="Review algorithmic flags for properties sharing identical GPS coordinates, phone numbers, or addresses."
        />

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : flags.length === 0 ? (
          <EmptyState 
            icon={<CheckCircle2 size={48} className="text-emerald-500" />}
            title="Duplicate Queue Is Clear!"
            description="No properties are currently flagged as potential duplicates."
          />
        ) : (
          <div className="space-y-4">
            {flags.map(flag => {
              const isResolving = resolvingId === flag.flag_id;
              return (
                <Card 
                  key={flag.flag_id}
                  className="p-6 border border-amber-200/70 hover:shadow-float transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-brand-navy text-base flex items-center gap-2">
                          <span>Potential Duplicate Detected</span>
                          {flag.similarity_score && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                              {(flag.similarity_score * 100).toFixed(0)}% Similarity
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Flag ID: <span className="font-mono">{flag.flag_id}</span>
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={flag.status || 'pending'} />
                  </div>

                  {/* Property IDs comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs mb-4">
                    <div>
                      <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Newly Registered Property
                      </span>
                      <p className="font-mono font-bold text-brand-navy">
                        {flag.property_id}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Matching Existing Property
                      </span>
                      <p className="font-mono font-bold text-brand-navy">
                        {flag.duplicate_of || 'Nearby GPS Location Match'}
                      </p>
                    </div>
                  </div>

                  {flag.reason && (
                    <p className="text-xs text-gray-600 mb-6 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                      <span className="font-bold text-amber-900">Detection Reason: </span>
                      {flag.reason}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleResolve(flag.flag_id, 'keep_separate')}
                      disabled={isResolving}
                      className="btn-secondary !py-2 !px-4 text-xs font-bold"
                    >
                      Keep Separate (Dismiss Flag)
                    </button>
                    <button
                      onClick={() => handleResolve(flag.flag_id, 'marked_duplicate')}
                      disabled={isResolving}
                      className="btn-danger !py-2 !px-4 text-xs font-bold"
                    >
                      Mark as Duplicate
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </PageTransition>
  );
}
