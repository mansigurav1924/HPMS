import { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { AlertTriangle, Clock, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Button, Card, Badge, PageTransition, StaggerList, Skeleton, EmptyState } from '../../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS_COLORS = {
  open:         'bg-blue-100 text-blue-800 border-blue-200',
  acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress:  'bg-brand-orange/20 text-brand-orange border-brand-orange/30',
  resolved:     'bg-green-100 text-green-800 border-green-200',
  closed:       'bg-gray-200 text-gray-700 border-gray-300',
  reopened:     'bg-brand-purple/20 text-brand-purple border-brand-purple/30',
};

function StatusBadge({ status }) {
  return (
    <Badge className={`border shadow-sm uppercase tracking-wider font-bold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ')}
    </Badge>
  );
}

export default function AdminEscalatedComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/complaints?escalated=true&page=${p}&page_size=20`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setComplaints(d.complaints || []);
      setTotal(d.total || 0);
      setPage(p);
    } catch (err) {} 
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight flex items-center gap-2">
              <AlertTriangle className="text-red-500" /> Escalated Complaints
            </h1>
            <p className="text-gray-500 font-medium mt-1">{total} escalated issues across all properties</p>
          </div>
          <Button variant="light-circle" onClick={() => load(page)} className="gap-2 shrink-0 border border-gray-200 !h-auto !px-4 !py-2 !rounded-xl">
            <RefreshCcw size={16} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : complaints.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={48} className="text-green-500 opacity-80"/>} title="All clear!" description="No escalated complaints currently require admin attention." />
        ) : (
          <StaggerList className="space-y-4">
            {complaints.map(c => (
              <Card key={c.complaint_id} className="p-6 border-l-4 border-l-red-500 hover:-translate-y-1 hover:shadow-float transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-brand-navy text-lg flex items-center gap-2 mb-1">
                      {c.category?.replace('_', ' / ')}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.priority === 'urgent' ? 'bg-red-100 text-red-800' : c.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'}`}>
                        {c.priority} Priority
                      </span>
                    </h3>
                    <p className="text-sm font-semibold text-gray-500 mb-2">
                      {c.tenant_name} <span className="mx-1 text-gray-300">•</span> {c.property_name}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                      <Clock size={12} /> Opened {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                    <StatusBadge status={c.status} />
                    <Badge className="bg-red-100 text-red-700 border border-red-200 shadow-sm font-bold uppercase tracking-wider">
                      <AlertTriangle size={10} className="mr-1 inline" /> Level {c.escalation_level}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </StaggerList>
        )}

        {total > 20 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button variant="light-circle" onClick={() => load(page - 1)} disabled={page === 1} className="!w-10 !h-10 p-0 border border-gray-200">←</Button>
            <span className="text-sm font-bold text-gray-500">Page {page}</span>
            <Button variant="light-circle" onClick={() => load(page + 1)} disabled={page * 20 >= total} className="!w-10 !h-10 p-0 border border-gray-200">→</Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
