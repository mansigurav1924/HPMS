import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { PageTransition, Card, Modal, EmptyState } from '../../components/ui';
import { PageHeader, DataTable, ConfirmDialog } from '../../components/ui/data';
import { toast } from '../../components/ui/toast';
import { 
  GraduationCap, Plus, Edit2, Trash2, MapPin, Search, 
  Building2, Globe
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function AdminColleges() {
  const { token } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    latitude: '',
    longitude: ''
  });

  // Delete state
  const [collegeToDelete, setCollegeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchColleges = () => {
    setLoading(true);
    let url = `${API}/colleges`;
    if (selectedCity) url += `?city=${encodeURIComponent(selectedCity)}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load colleges');
        return res.json();
      })
      .then(d => {
        setColleges(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchColleges();
  }, [selectedCity, token]);

  const openCreateModal = () => {
    setEditingCollege(null);
    setForm({ name: '', city: 'Vadodara', latitude: '22.3072', longitude: '73.1812' });
    setModalOpen(true);
  };

  const openEditModal = (college) => {
    setEditingCollege(college);
    setForm({
      name: college.name,
      city: college.city,
      latitude: String(college.latitude || ''),
      longitude: String(college.longitude || '')
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      toast.error('College name and city are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        latitude: parseFloat(form.latitude) || 22.3072,
        longitude: parseFloat(form.longitude) || 73.1812
      };

      const isEdit = Boolean(editingCollege);
      const url = isEdit
        ? `${API}/colleges/${editingCollege.college_id}`
        : `${API}/colleges`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save college');
      }

      toast.success(isEdit ? 'College updated.' : 'College added successfully.');
      setModalOpen(false);
      fetchColleges();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collegeToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/colleges/${collegeToDelete.college_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not delete college (may have associated properties)');
      }

      toast.success('College deleted.');
      setCollegeToDelete(null);
      fetchColleges();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const cities = Array.from(new Set(colleges.map(c => c.city).filter(Boolean)));

  const columns = [
    {
      key: 'name',
      header: 'College / Institute Name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="font-extrabold text-brand-navy text-sm">{r.name}</p>
            <p className="text-xs text-gray-400">ID: {r.college_id}</p>
          </div>
        </div>
      )
    },
    {
      key: 'city',
      header: 'City',
      render: (r) => (
        <span className="font-semibold text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
          {r.city}
        </span>
      )
    },
    {
      key: 'coords',
      header: 'Geo Coordinates',
      render: (r) => (
        <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
          <MapPin size={13} className="text-gray-400" />
          {r.latitude ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : 'Not set'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(r)}
            className="btn-light-circle !w-8 !h-8 text-gray-500 hover:text-brand-navy"
            title="Edit College"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setCollegeToDelete(r)}
            className="btn-light-circle !w-8 !h-8 text-gray-400 hover:text-rose-600"
            title="Delete College"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          title="Colleges & University Campuses"
          subtitle="Manage higher education institutions used for student proximity matching and discovery."
          actions={
            <button
              onClick={openCreateModal}
              className="btn-cta flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Add College</span>
            </button>
          }
        />

        {/* Data Table */}
        <DataTable 
          columns={columns}
          rows={colleges}
          loading={loading}
          rowKey="college_id"
          searchKeys={['name', 'city']}
          searchPlaceholder="Search colleges by name or city..."
          filters={
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="field-input !h-10 text-xs font-semibold"
              aria-label="Filter colleges by city"
            >
              <option value="">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          }
          emptyTitle="No colleges found"
          emptyDescription="Add university or college landmarks so students can search hostels near their campus."
        />

        {/* Add/Edit College Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCollege ? "Edit College Information" : "Register New College"}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Institute / University Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Parul University, MSU Vadodara"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="field-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                City *
              </label>
              <input
                type="text"
                placeholder="e.g. Vadodara, Ahmedabad"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="field-input w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="22.3072"
                  value={form.latitude}
                  onChange={e => setForm({ ...form, latitude: e.target.value })}
                  className="field-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="73.1812"
                  value={form.longitude}
                  onChange={e => setForm({ ...form, longitude: e.target.value })}
                  className="field-input w-full"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-cta !py-2.5"
                disabled={saving}
              >
                {saving ? 'Saving...' : editingCollege ? 'Save Changes' : 'Add College'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog 
          isOpen={Boolean(collegeToDelete)}
          onClose={() => setCollegeToDelete(null)}
          onConfirm={handleDelete}
          title="Delete College Landmark?"
          description={`Are you sure you want to remove "${collegeToDelete?.name}"? If any properties are associated with this college, deletion will be rejected.`}
          confirmLabel="Delete College"
          tone="danger"
          loading={deleting}
        />

      </div>
    </PageTransition>
  );
}
