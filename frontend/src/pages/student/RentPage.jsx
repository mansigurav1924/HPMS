import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Badge } from '../../components/ui';
import { AlertCircle, FileText } from 'lucide-react';

export default function RentPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/tenancies', {
      headers: { 'Authorization': 'Bearer ' + user.token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then(d => {
        setData(d.data || d.reviews || d.users || d.bookings || d.tenancies || d.logs || d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [user]);

  if (loading) return (
    <PageTransition>
      <div className="p-6"><Skeleton className="h-8 w-64 mb-6" /><Skeleton className="h-64 w-full" /></div>
    </PageTransition>
  );

  if (error) return (
    <PageTransition>
      <EmptyState icon={<AlertCircle size={48} className="text-red-400" />} title="Error" description={error} />
    </PageTransition>
  );

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Rent & Dues</h1>
        </div>
        
        {!data || (Array.isArray(data) && data.length === 0) ? (
          <EmptyState icon={<FileText size={48} className="text-gray-300" />} title="No data found" description="There is currently no data to display here." />
        ) : (
          <div className="grid gap-4">
            {Array.isArray(data) ? data.map((item, i) => (
              <Card key={i} className="p-4 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
                </div>
              </Card>
            )) : (
              <Card className="p-4">
                <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
