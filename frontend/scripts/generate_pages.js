const fs = require('fs');
const path = require('path');

const studentPages = [
  { name: 'BookingsPage', route: 'bookings', endpoint: '/bookings', title: 'My Bookings', type: 'student' },
  { name: 'StayPage', route: 'stay', endpoint: '/tenancies', title: 'My Stay', type: 'student' },
  { name: 'RentPage', route: 'rent', endpoint: '/tenancies', title: 'Rent & Dues', type: 'student' },
  { name: 'NoticesPage', route: 'notices', endpoint: '/notices', title: 'Notices', type: 'student' },
  { name: 'NotificationsPage', route: 'notifications', endpoint: '/notifications', title: 'Notifications', type: 'student' },
  { name: 'ReviewsPage', route: 'reviews', endpoint: '/reviews/mine', title: 'My Reviews', type: 'student' },
  { name: 'ProfilePage', route: 'profile', endpoint: '/users/me', title: 'My Profile', type: 'student' },
];

const ownerPages = [
  { name: 'OwnerDashboard', route: '', endpoint: '/dashboard/owner', title: 'Owner Dashboard', type: 'owner' },
  { name: 'OwnerBookings', route: 'bookings', endpoint: '/bookings', title: 'Booking Requests', type: 'owner' },
  { name: 'OwnerTenants', route: 'tenants', endpoint: '/tenancies', title: 'Tenants', type: 'owner' },
  { name: 'OwnerRent', route: 'rent', endpoint: '/tenancies', title: 'Rent Ledger', type: 'owner' },
  { name: 'OwnerNotices', route: 'notices', endpoint: '/notices', title: 'Notices', type: 'owner' },
  { name: 'OwnerReviews', route: 'reviews', endpoint: '/reviews/mine', title: 'Reviews', type: 'owner' },
  { name: 'OwnerReports', route: 'reports', endpoint: '/exports', title: 'Reports & Exports', type: 'owner' },
];

const adminPages = [
  { name: 'AdminDashboard', route: '', endpoint: '/dashboard/admin', title: 'Admin Dashboard', type: 'admin' },
  { name: 'AdminProperties', route: 'properties', endpoint: '/admin/properties', title: 'Properties Moderation', type: 'admin' },
  { name: 'AdminDuplicates', route: 'duplicates', endpoint: '/admin/duplicates', title: 'Duplicates Resolution', type: 'admin' },
  { name: 'AdminUsers', route: 'users', endpoint: '/admin/users', title: 'Users Management', type: 'admin' },
  { name: 'AdminReviews', route: 'reviews', endpoint: '/admin/reviews', title: 'Reviews Moderation', type: 'admin' },
  { name: 'AdminReports', route: 'reports', endpoint: '/exports', title: 'Reports & Exports', type: 'admin' },
  { name: 'AdminAuditLog', route: 'audit', endpoint: '/admin/audit-logs', title: 'Audit Log', type: 'admin' },
  { name: 'AdminNotifications', route: 'notifications', endpoint: '/admin/notifications', title: 'Notifications Log', type: 'admin' },
  { name: 'AdminDataAccess', route: 'data-access', endpoint: '/data-access', title: 'Data Access Requests', type: 'admin' },
  { name: 'AdminColleges', route: 'colleges', endpoint: '/colleges', title: 'Colleges Management', type: 'admin' },
];

const template = (page) => `import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, EmptyState, Skeleton, Card, Badge } from '../../components/ui';
import { AlertCircle, FileText } from 'lucide-react';

export default function ` + page.name + `() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '` + page.endpoint + `', {
      headers: { 'Authorization': 'Bearer ' + token }
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
          <h1 className="text-2xl font-bold text-gray-900">` + page.title + `</h1>
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
`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(path.join(__dirname, '../src/pages/student'));
ensureDir(path.join(__dirname, '../src/pages/owner'));
ensureDir(path.join(__dirname, '../src/pages/admin'));

[...studentPages, ...ownerPages, ...adminPages].forEach(page => {
  const destPath = path.join(__dirname, '../src/pages', page.type, page.name + '.jsx');
  if (!fs.existsSync(destPath)) {
      fs.writeFileSync(destPath, template(page));
      console.log('Created', destPath);
  } else {
      console.log('Skipped', destPath);
  }
});
