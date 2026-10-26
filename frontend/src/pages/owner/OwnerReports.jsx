import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card } from '../../components/ui';
import { PageHeader, StatusBadge } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  Download, FileSpreadsheet, Users, Calendar, AlertTriangle, 
  ShieldCheck, Info, Clock, CheckCircle2, FileText
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function OwnerReports() {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (resource, filename) => {
    setDownloading(prev => ({ ...prev, [resource]: true }));
    try {
      const res = await fetch(`${API}/export/${resource}?format=csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${resource}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${resource.toUpperCase()} export downloaded successfully!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(prev => ({ ...prev, [resource]: false }));
    }
  };

  const exportCards = [
    {
      id: 'bookings',
      title: 'Bookings Register',
      description: 'Comprehensive historical record of all room reservation requests, approval statuses, check-in schedules, and room rent agreements.',
      fields: ['Booking ID', 'Status', 'Move-in Date', 'Rent Amount'],
      icon: <Calendar className="text-primary-600" size={24} />,
      tone: 'indigo',
      resource: 'bookings',
      filename: `bookings_register_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'tenants',
      title: 'Tenant Directory & Contacts',
      description: 'Directory of all active and former residents residing at your properties, including verified names, email addresses, and phone contacts.',
      fields: ['User ID', 'Name', 'Email Address', 'Phone Number'],
      icon: <Users className="text-emerald-600" size={24} />,
      tone: 'emerald',
      resource: 'tenants',
      filename: `tenants_directory_${new Date().toISOString().split('T')[0]}.csv`
    },
    {
      id: 'complaints',
      title: 'Maintenance & Complaints Log',
      description: 'Audit log of maintenance tickets, issue categories, resolution statuses, and severity levels raised by residents across your buildings.',
      fields: ['Complaint ID', 'Category', 'Status', 'Priority'],
      icon: <AlertTriangle className="text-amber-600" size={24} />,
      tone: 'amber',
      resource: 'complaints',
      filename: `complaints_log_${new Date().toISOString().split('T')[0]}.csv`
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <PageHeader 
          title="Export Data & Operational Reports"
          subtitle="Generate standardized CSV datasets for property accounting, audit compliance, and resident records."
        />

        {/* Notice on Payments */}
        <div className="p-4 rounded-2xl bg-primary-50/70 border border-primary-200/60 flex items-start gap-3.5">
          <Info size={20} className="text-primary-600 shrink-0 mt-0.5" />
          <div className="text-xs text-primary-950 space-y-1">
            <p className="font-extrabold text-sm">Automated Export Standards</p>
            <p className="text-primary-800 leading-relaxed">
              All exports are generated in RFC 4180 compliant CSV format, sanitized against formula injection, and capped at 5,000 records per export. Payment and ledger exports are temporarily paused while payment gateway integration is undergoing scheduled maintenance.
            </p>
          </div>
        </div>

        {/* Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exportCards.map(card => {
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

                  <h3 className="font-extrabold text-brand-navy text-lg mb-2">
                    {card.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed mb-6">
                    {card.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      Included Columns:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {card.fields.map((f, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(card.resource, card.filename)}
                  disabled={isLoading}
                  className="btn-cta w-full flex items-center justify-center gap-2 !py-2.5"
                >
                  <Download size={16} />
                  <span>{isLoading ? 'Exporting CSV...' : 'Download CSV'}</span>
                </button>
              </Card>
            );
          })}
        </div>

        {/* Paused Ledgers Section */}
        <div className="card p-6 border-dashed border-gray-200 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-brand-navy text-sm">Rent & Deposit Ledgers</h4>
                <p className="text-xs text-gray-500">Payments collection reports and security deposit settlement receipts</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Payments Inactive
            </span>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
