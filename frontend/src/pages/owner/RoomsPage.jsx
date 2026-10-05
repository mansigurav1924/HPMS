import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function RoomsPage() {
  const { propertyId } = useParams();
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState({});
  const [form, setForm] = useState({ room_number: '', floor: '', room_type: 'single', capacity: 1, is_ac: false, attached_bath: false, monthly_rent: '', deposit: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingRoom, setUploadingRoom] = useState(null);
  const [msg, setMsg] = useState('');

  const loadRooms = () =>
    fetch(`${API}/properties/${propertyId}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRooms(Array.isArray(d) ? d : []));

  const loadBeds = (roomId) =>
    fetch(`${API}/rooms/${roomId}/beds`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setBeds(prev => ({ ...prev, [roomId]: Array.isArray(d) ? d : [] })));

  useEffect(() => { loadRooms(); }, [propertyId]);

  const addRoom = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/properties/${propertyId}/rooms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, capacity: parseInt(form.capacity), monthly_rent: parseFloat(form.monthly_rent), deposit: form.deposit ? parseFloat(form.deposit) : null }),
    });
    const data = await res.json();
    if (res.ok) { setMsg(`✅ Room created with ${data.beds_created} bed(s)`); loadRooms(); }
    else setMsg(`❌ ${data.detail}`);
  };

  const toggleBed = async (bedId, currentStatus) => {
    const action = currentStatus === 'maintenance' ? 'unblock' : 'block';
    const res = await fetch(`${API}/beds/${bedId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      // Reload all bed lists
      rooms.forEach(r => loadBeds(r.room_id));
    } else {
      const d = await res.json(); setMsg(`❌ ${d.detail}`);
    }
  };

  const uploadPhoto = async (roomId) => {
    if (!photoFile) return;
    const fd = new FormData();
    fd.append('photo', photoFile);
    setUploadingRoom(roomId);
    const res = await fetch(`${API}/rooms/${roomId}/photos`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    const d = await res.json();
    setMsg(res.ok ? `✅ Photo uploaded` : `❌ ${d.detail}`);
    setUploadingRoom(null);
  };

  const BED_COLOR = { available: 'bg-green-100 text-green-700', maintenance: 'bg-red-100 text-red-700', occupied: 'bg-yellow-100 text-yellow-700', reserved: 'bg-blue-100 text-blue-700' };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rooms & Beds</h1>
      {msg && <div className="mb-4 p-3 rounded text-sm bg-gray-50 border">{msg}</div>}

      {/* Add Room Form */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Add Room</h2>
        <form onSubmit={addRoom} className="grid grid-cols-2 gap-3">
          {[['Room Number *', 'room_number', 'text'], ['Floor', 'floor', 'text'], ['Monthly Rent (₹) *', 'monthly_rent', 'number'], ['Deposit (₹)', 'deposit', 'number'], ['Capacity *', 'capacity', 'number']].map(([lbl, key, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{lbl}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none" required={lbl.endsWith('*')} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Room Type</label>
            <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
              className="w-full border rounded px-2 py-1.5 text-sm">
              {['single', 'double', 'triple', 'dormitory'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 col-span-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_ac} onChange={e => setForm(f => ({ ...f, is_ac: e.target.checked }))} /> AC</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.attached_bath} onChange={e => setForm(f => ({ ...f, attached_bath: e.target.checked }))} /> Attached Bath</label>
          </div>
          <div className="col-span-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700 transition text-sm">Add Room</button>
          </div>
        </form>
      </div>

      {/* Rooms List */}
      {rooms.map(room => (
        <div key={room.room_id} className="bg-white rounded-xl shadow p-5 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Room {room.room_number}</h3>
              <p className="text-sm text-gray-500">{room.room_type} · Capacity {room.capacity} · ₹{room.monthly_rent}/mo {room.is_ac ? '· AC' : ''} {room.attached_bath ? '· Attached Bath' : ''}</p>
            </div>
            <button onClick={() => loadBeds(room.room_id)} className="text-xs text-indigo-600 hover:underline">Load Beds</button>
          </div>

          {/* Beds */}
          {beds[room.room_id] && (
            <div className="flex flex-wrap gap-2 mb-3">
              {beds[room.room_id].map(bed => (
                <div key={bed.bed_id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${BED_COLOR[bed.status] || 'bg-gray-100'}`}>
                  {bed.bed_label} · {bed.status}
                  {['available', 'maintenance'].includes(bed.status) && (
                    <button onClick={() => toggleBed(bed.bed_id, bed.status)}
                      className="ml-1 underline hover:no-underline">
                      {bed.status === 'maintenance' ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Photo Upload */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])}
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:text-gray-600" />
            <button onClick={() => uploadPhoto(room.room_id)} disabled={uploadingRoom === room.room_id}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition disabled:opacity-50">
              {uploadingRoom === room.room_id ? 'Uploading…' : 'Upload Photo'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
