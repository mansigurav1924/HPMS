import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Building2, MapPin, Pencil, BedDouble, Send, Power } from 'lucide-react';
import {
  Button, Card, PageTransition, PageHeader, Skeleton, EmptyState, StatusBadge, ConfirmDialog, toast,
} from '../../components/ui';
import { apiFetch } from '../../lib/api';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600';

export default function PropertiesList() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDeactivate, setToDeactivate] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/properties/mine', token)
      .then((d) => setProperties(Array.isArray(d) ? d : []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(load, [load]);

  const submitForReview = async (p) => {
    try {
      await apiFetch(`/properties/${p.property_id}/submit`, token, { method: 'POST' });
      toast.success(`${p.name} submitted for review`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    try {
      await apiFetch(`/properties/${toDeactivate.property_id}`, token, { method: 'DELETE' });
      toast.success('Property deactivated');
      setToDeactivate(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="My Properties"
          subtitle="Manage your listings and track their verification status."
          actions={
            <Link to="/owner/properties/new" className="btn-cta">
              <Plus size={18} /> Add Property
            </Link>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Building2 size={44} className="text-primary-300" />}
              title="No properties yet"
              description="Start by adding your first hostel or PG listing."
              action={<Link to="/owner/properties/new" className="btn-cta">Add Property</Link>}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((p, i) => (
              <motion.div
                key={p.property_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.4), duration: 0.3 }}
              >
                <Card className="card-hover group h-full flex flex-col">
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <img
                      src={p.cover_photo || FALLBACK_IMG}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={p.status} className="bg-white/95 backdrop-blur" />
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="font-extrabold text-lg text-brand-navy truncate">{p.name}</h2>
                    <p className="text-xs font-semibold text-primary-600 capitalize mt-0.5">{p.type?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                      <MapPin size={14} /> {p.city}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
                      <Link to={`/owner/properties/${p.property_id}/edit`} className="btn-secondary !py-1.5 !px-3 text-xs">
                        <Pencil size={13} /> Edit
                      </Link>
                      <Link to={`/owner/properties/${p.property_id}/rooms`} className="btn-secondary !py-1.5 !px-3 text-xs">
                        <BedDouble size={13} /> Rooms
                      </Link>
                      {p.status === 'Draft' && (
                        <Button className="!py-1.5 !px-3 text-xs" onClick={() => submitForReview(p)}>
                          <Send size={13} /> Submit
                        </Button>
                      )}
                      <button
                        onClick={() => setToDeactivate(p)}
                        className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <Power size={13} /> Deactivate
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(toDeactivate)}
        onClose={() => setToDeactivate(null)}
        onConfirm={deactivate}
        loading={busy}
        tone="danger"
        title="Deactivate property?"
        description={toDeactivate ? `${toDeactivate.name} will no longer be visible to students.` : ''}
        confirmLabel="Deactivate"
      />
    </PageTransition>
  );
}
