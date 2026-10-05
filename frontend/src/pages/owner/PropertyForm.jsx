import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const FACILITIES = [
  'WiFi', 'Meals', 'Laundry', 'Parking', 'Security Guard', 'CCTV',
  'AC', 'Geyser', 'Gym', 'Study Room', 'Housekeeping', 'Power Backup',
];

export default function PropertyForm() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', type: 'boys_hostel', address: '', city: 'Vadodara', area: '',
    latitude: '', longitude: '', description: '', house_rules: '',
    facilities: [], security_deposit_default: '', notice_period_days: '30',
    lock_in_months: '', booking_mode: 'approval', rent_due_day: '5',
    rent_cycle_mode: 'monthly',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFacility = (f) => setForm(prev => ({
    ...prev,
    facilities: prev.facilities.includes(f)
      ? prev.facilities.filter(x => x !== f)
      : [...prev.facilities, f],
  }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      security_deposit_default: form.security_deposit_default ? parseFloat(form.security_deposit_default) : null,
      notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : null,
      lock_in_months:     form.lock_in_months     ? parseInt(form.lock_in_months)     : null,
      rent_due_day:       form.rent_due_day        ? parseInt(form.rent_due_day)        : null,
    };
    const res = await fetch(`${API}/properties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) navigate('/owner/properties');
    else setError(data.detail || 'Failed to create property');
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        {...opts} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Property</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        {field('Property Name *', 'name', 'text', { required: true })}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="boys_hostel">Boys Hostel</option>
            <option value="girls_hostel">Girls Hostel</option>
            <option value="coed">Co-Ed</option>
            <option value="pg">PG</option>
          </select>
        </div>

        {field('Address *', 'address', 'text', { required: true })}
        {field('City *', 'city', 'text', { required: true })}
        {field('Area / Locality', 'area')}

        <div className="grid grid-cols-2 gap-4">
          {field('Latitude', 'latitude', 'number')}
          {field('Longitude', 'longitude', 'number')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
          <textarea value={form.house_rules} onChange={e => set('house_rules', e.target.value)}
            rows={2} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map(f => (
              <button type="button" key={f}
                onClick={() => toggleFacility(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  form.facilities.includes(f)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Security Deposit (₹)', 'security_deposit_default', 'number')}
          {field('Notice Period (days)', 'notice_period_days', 'number')}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Lock-in Period (months)', 'lock_in_months', 'number')}
          {field('Rent Due Day (1-31)', 'rent_due_day', 'number')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Booking Mode *</label>
          <select value={form.booking_mode} onChange={e => set('booking_mode', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm">
            <option value="approval">Approval Required</option>
            <option value="instant">Instant Booking</option>
          </select>
        </div>

        <button type="submit" disabled={saving}
          className="bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Create Property (Draft)'}
        </button>
      </form>
    </div>
  );
}
