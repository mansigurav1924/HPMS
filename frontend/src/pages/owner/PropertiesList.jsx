import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Building2, MapPin, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Button, Card, Badge, PageTransition, StaggerList, Skeleton, EmptyState } from '../../components/ui';

const API = import.meta.env.VITE_API_URL;

const STATUS_BADGE = {
  Draft:    { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: null },
  Pending:  { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <AlertCircle size={12} className="mr-1 inline" /> },
  Approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 size={12} className="mr-1 inline" /> },
  Rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={12} className="mr-1 inline" /> },
  Inactive: { color: 'bg-gray-200 text-gray-500 border-gray-300', icon: null },
};

export default function PropertiesList() {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`${API}/properties/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setProperties(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const submitForReview = async (id) => {
    await fetch(`${API}/properties/${id}/submit`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this property?')) return;
    const r = await fetch(`${API}/properties/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok || r.status === 204) load();
    else { const d = await r.json(); alert(d.detail); }
  };

  return (
    <PageTransition>
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">My Properties</h1>
            <p className="text-gray-500 font-medium mt-1">Manage your listings and track their status</p>
          </div>
          <Link to="/owner/properties/new">
            <Button className="gap-2 shrink-0"><Plus size={18} /> Add Property</Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : properties.length === 0 ? (
          <EmptyState 
            icon={<Building2 size={48} className="text-brand-sky opacity-50"/>} 
            title="No properties yet" 
            description="Start by adding your first hostel or PG listing." 
            action={<Link to="/owner/properties/new"><Button>Add Property</Button></Link>} 
          />
        ) : (
          <StaggerList className="space-y-4">
            {properties.map(p => {
              const statusConfig = STATUS_BADGE[p.status] || STATUS_BADGE['Draft'];
              return (
                <Card key={p.property_id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:-translate-y-1 hover:shadow-float transition-all duration-300">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                      <img src={p.cover_photo || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=200'} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-lg text-brand-navy mb-1">{p.name}</h2>
                      <p className="text-xs font-semibold text-gray-500 mb-2 capitalize">{p.type?.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {p.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                    <Badge className={`border ${statusConfig.color} shadow-sm font-bold uppercase tracking-wider`}>
                      {statusConfig.icon}{p.status}
                    </Badge>
                    <div className="flex flex-wrap gap-2 w-full justify-end">
                      <Link to={`/owner/properties/${p.property_id}/rooms`}>
                        <Button variant="light-circle" className="!px-4 !py-1.5 !rounded-lg !text-xs !h-auto border border-gray-200">Rooms</Button>
                      </Link>
                      {p.status === 'Draft' && (
                        <Button className="!px-4 !py-1.5 !rounded-lg !text-xs !h-auto" onClick={() => submitForReview(p.property_id)}>
                          Submit for Review
                        </Button>
                      )}
                      <Button variant="light-circle" className="!px-4 !py-1.5 !rounded-lg !text-xs !h-auto bg-red-50 text-red-600 hover:bg-red-100 border-none" onClick={() => deactivate(p.property_id)}>
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </StaggerList>
        )}
      </div>
    </PageTransition>
  );
}
