import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Card, PageTransition } from '../../components/ui';
import { Check } from 'lucide-react';
import GoogleMapsProvider from '../../components/maps/GoogleMapsProvider';
import MapView from '../../components/maps/MapView';
import PropertyMarker from '../../components/maps/PropertyMarker';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

const API = import.meta.env.VITE_API_URL;

const FACILITIES = [
  'WiFi', 'Meals', 'Laundry', 'Parking', 'Security Guard', 'CCTV',
  'AC', 'Geyser', 'Gym', 'Study Room', 'Housekeeping', 'Power Backup',
];

function AddressInput({ value, onChange, onSelect }) {
  const inputRef = useRef(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'name'],
    });
    
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name;
      if (address) {
        onChange(address);
        onSelect(address);
      }
    });

    return () => {
      if (listener) listener.remove();
    };
  }, [places, onChange, onSelect]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pill-input !py-2.5 w-full"
      placeholder="Start typing to search..."
      required
    />
  );
}

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
  const [geocoding, setGeocoding] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  // Geocoding debounce
  useEffect(() => {
    if (!form.address || form.address.length < 5) return;
    
    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(`${API}/maps/geocode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ address: form.address })
        });
        
        if (res.ok) {
          const data = await res.json();
          setForm(prev => ({
            ...prev,
            latitude: data.lat,
            longitude: data.lng,
            city: data.city || prev.city,
            area: data.area || prev.area
          }));
        }
      } catch (err) {
        console.error("Geocoding error", err);
      } finally {
        setGeocoding(false);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [form.address, token]);
  const toggleFacility = (f) => setForm(prev => ({
    ...prev,
    facilities: prev.facilities.includes(f)
      ? prev.facilities.filter(x => x !== f)
      : [...prev.facilities, f],
  }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    const payload = {
      ...form,
      latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      security_deposit_default: form.security_deposit_default ? parseFloat(form.security_deposit_default) : null,
      notice_period_days: form.notice_period_days ? parseInt(form.notice_period_days) : null,
      lock_in_months:     form.lock_in_months     ? parseInt(form.lock_in_months)     : null,
      rent_due_day:       form.rent_due_day       ? parseInt(form.rent_due_day)       : null,
    };
    const res = await fetch(`${API}/properties`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) navigate('/owner/properties');
    else setError(data.detail || 'Failed to create property');
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} className="pill-input !py-2.5" {...opts} />
    </div>
  );

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-extrabold text-brand-navy mb-8 tracking-tight">Add New Property</h1>
        
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold shadow-sm">{error}</div>}
        
        <form onSubmit={submit} className="space-y-8">
          <Card className="p-8">
            <h2 className="text-lg font-extrabold text-brand-navy mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">{field('Property Name *', 'name', 'text', { required: true })}</div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type *</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} className="pill-select w-full !py-2.5">
                  <option value="boys_hostel">Boys Hostel</option>
                  <option value="girls_hostel">Girls Hostel</option>
                  <option value="coed">Co-Ed</option>
                  <option value="pg">PG</option>
                </select>
              </div>
              <div>{field('Booking Mode *', 'booking_mode', 'text', { as: 'select' /* fallback, custom below */ })}
                <select value={form.booking_mode} onChange={e => set('booking_mode', e.target.value)} className="pill-select w-full !py-2.5 -mt-[4.5rem]">
                  <option value="approval">Approval Required</option>
                  <option value="instant">Instant Booking</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-lg font-extrabold text-brand-navy mb-6">Location</h2>
            <GoogleMapsProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Address (Search Google Maps) *</label>
                  <AddressInput 
                    value={form.address} 
                    onChange={v => set('address', v)} 
                    onSelect={v => set('address', v)} 
                  />
                  {geocoding && <span className="text-xs text-brand-orange mt-1 block">Locating...</span>}
                </div>
                <div>{field('City *', 'city', 'text', { required: true })}</div>
                <div>{field('Area / Locality', 'area')}</div>
                <div>{field('Latitude (Auto-filled)', 'latitude', 'number', { readOnly: true, className: "pill-input !py-2.5 bg-gray-50" })}</div>
                <div>{field('Longitude (Auto-filled)', 'longitude', 'number', { readOnly: true, className: "pill-input !py-2.5 bg-gray-50" })}</div>
              </div>
              
              {form.latitude && form.longitude && (
                <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 mt-4 shadow-sm relative">
                  <MapView center={{ lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }} zoom={15}>
                    <PropertyMarker property={{ lat: parseFloat(form.latitude), lng: parseFloat(form.longitude), min_rent: form.rent_due_day ? "Pin" : "Pin" }} />
                  </MapView>
                  <div className="absolute top-2 left-2 bg-white/90 px-3 py-1 rounded shadow text-xs font-bold text-brand-navy z-[100]">
                    Map Preview
                  </div>
                </div>
              )}
            </GoogleMapsProvider>
          </Card>

          <Card className="p-8">
            <h2 className="text-lg font-extrabold text-brand-navy mb-6">Details & Rules</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">House Rules</label>
                <textarea value={form.house_rules} onChange={e => set('house_rules', e.target.value)} rows={2} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sky resize-none" />
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-lg font-extrabold text-brand-navy mb-6">Facilities</h2>
            <div className="flex flex-wrap gap-3">
              {FACILITIES.map(f => {
                const isActive = form.facilities.includes(f);
                return (
                  <button type="button" key={f} onClick={() => toggleFacility(f)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-brand-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {isActive && <Check size={14} />} {f}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-lg font-extrabold text-brand-navy mb-6">Financials & Policies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field('Security Deposit (₹)', 'security_deposit_default', 'number')}
              {field('Notice Period (days)', 'notice_period_days', 'number')}
              {field('Lock-in Period (months)', 'lock_in_months', 'number')}
              {field('Rent Due Day (1-31)', 'rent_due_day', 'number')}
            </div>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" disabled={saving} className="!px-8 !py-3 !text-base">
              {saving ? 'Saving…' : 'Create Property (Draft)'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
