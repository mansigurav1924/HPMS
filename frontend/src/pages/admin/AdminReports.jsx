import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card } from '../../components/ui';
import { PageHeader } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Download, FileSpreadsheet, Users, Calendar, AlertTriangle, 
  ShieldCheck, Info, FileText, Activity
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminReports() {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (resource, filename, isAudit = false) => {
    setDownloading(prev => ({ ...prev, [resource]: true }));
    try {
      const url = isAudit
        ? `${API}/admin/audit-logs?export=true`
        : `${API}/export/${resource}?format=csv`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Export failed');
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || `${resource}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`${resource.toUpperCase()} dataset exported successfully.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(prev => ({ ...prev, [resource]: false }));
    }
  };

  const adminExports = [
    {
      id: 'bookings',
      title: 'Global Bookings Register',
      description: 'Platform-wide export of all room reservation requests, move-in dates, rental tariffs, and approval states across every property.',
      fields: ['Booking ID', 'Status', 'Move-in Date', 'Rent Amount'],
      icon: <Calendar className="text-primary-600" size={24} />,
      resource: 'bookings',
      filename: `admin_all_bookings_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'tenants',
      title: 'Registered Student Directory',
      description: 'Master list of registered student accounts, verified contact emails, phone numbers, and account registration dates.',
      fields: ['User ID', 'Name', 'Email Address', 'Phone Number'],
      icon: <Users className="text-emerald-600" size={24} />,
      resource: 'tenants',
      filename: `admin_all_students_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'complaints',
      title: 'System Complaints & Maintenance',
      description: 'Aggregate log of all tenant maintenance tickets, categories, SLA escalations, and resolution lifecycles.',
      fields: ['Complaint ID', 'Category', 'Status', 'Priority'],
      icon: <AlertTriangle className="text-amber-600" size={24} />,
      resource: 'complaints',
      filename: `admin_all_complaints_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'audit',
      title: 'Security & Audit Log Export',
      description: 'Complete security audit trail covering administrative actions, logins, property status changes, and data mutations.',
      fields: ['Timestamp', 'Actor ID', 'Role', 'Action', 'Entity Type', 'New Data'],
      icon: <Activity className="text-violet-600" size={24} />,
      resource: 'audit',
      isAudit: true,
      filename: `admin_audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <PageHeader 
          title="Platform Exports & Compliance Reports"
          subtitle="Generate verifiable RFC 4180 CSV exports for institutional reporting, platform audits, and data governance."
        />

        {/* Security Alert Banner */}
        <div className="p-4 rounded-2xl bg-primary-50/70 border border-primary-200/60 flex items-start gap-3.5">
          <Info size={20} className="text-primary-600 shrink-0 mt-0.5" />
          <div className="text-xs text-primary-950 space-y-1">
            <p className="font-extrabold text-sm">Regulatory Export Standards</p>
            <p className="text-primary-800 leading-relaxed">
              All exports are sanitized against spreadsheet formula injection (=, +, -, @), logged to the immutable audit database, and throttled to prevent resource exhaustion. Payment ledgers remain locked until financial gateway activation.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminExports.map(card => {
            const isLoading = downloading[card.resource];
            return (
              <Card 
                key={card.id}
                className="p-6 flex flex-col justify-between hover:shadow-float transition-all relative overflow-hidden"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                    {card.icon}
                  </div>

                  <h3 className="font-extrabold text-brand-navy text-base mb-2">
                    {card.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    {card.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Schema Columns:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {card.fields.map((f, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(card.resource, card.filename, card.isAudit)}
                  disabled={isLoading}
                  className="btn-cta w-full flex items-center justify-center gap-2 !py-2.5 !text-xs font-bold"
                >
                  <Download size={15} />
                  <span>{isLoading ? 'Exporting...' : 'Export Dataset'}</span>
                </button>
              </Card>
            );
          })}
        </div>

      </div>
    </PageTransition>
  );
}
