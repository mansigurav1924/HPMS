import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useParams, Link } from 'react-router-dom';
import { Plus, ChevronLeft, BedDouble, CheckCircle2, ShieldCheck, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card, Badge, PageTransition, StaggerList, Skeleton, EmptyState } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;

export default function RoomsPage() {
  const { propertyId } = useParams();
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState({});
  const [expandedRooms, setExpandedRooms] = useState({});
  const [form, setForm] = useState({ room_number: '', floor: '', room_type: 'single', capacity: 1, is_ac: false, attached_bath: false, monthly_rent: '', deposit: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingRoom, setUploadingRoom] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRooms = () => {
    setLoading(true);
    fetch(`${API}/properties/${propertyId}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setRooms(Array.isArray(d) ? d : []); setLoading(false); });
  };

  const loadBeds = (roomId) => {
    fetch(`${API}/rooms/${roomId}/beds`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setBeds(prev => ({ ...prev, [roomId]: Array.isArray(d) ? d : [] })));
  };

  const toggleExpanded = (roomId) => {
    const isExpanded = !!expandedRooms[roomId];
    if (!isExpanded && !beds[roomId]) loadBeds(roomId);
    setExpandedRooms(prev => ({ ...prev, [roomId]: !isExpanded }));
  };

  useEffect(() => { loadRooms(); }, [propertyId]);

  const addRoom = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/properties/${propertyId}/rooms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, capacity: parseInt(form.capacity), monthly_rent: parseFloat(form.monthly_rent), deposit: form.deposit ? parseFloat(form.deposit) : null }),
    });
    const data = await res.json();
    if (res.ok) { setMsg(`✅ Room created with ${data.beds_created} bed(s)`); loadRooms(); setForm({ room_number: '', floor: '', room_type: 'single', capacity: 1, is_ac: false, attached_bath: false, monthly_rent: '', deposit: '' }); }
    else setMsg(`❌ ${data.detail}`);
  };

  const toggleBed = async (bedId, currentStatus, roomId) => {
    const action = currentStatus === 'maintenance' ? 'unblock' : 'block';
    const res = await fetch(`${API}/beds/${bedId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) { loadBeds(roomId); } 
    else { const d = await res.json(); setMsg(`❌ ${d.detail}`); }
  };

  const uploadPhoto = async (roomId) => {
    if (!photoFile) return;
    const fd = new FormData(); fd.append('photo', photoFile);
    setUploadingRoom(roomId);
    const res = await fetch(`${API}/rooms/${roomId}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const d = await res.json();
    setMsg(res.ok ? `✅ Photo uploaded` : `❌ ${d.detail}`);
    setUploadingRoom(null); setPhotoFile(null);
  };

  const BED_COLOR = { 
    available: 'bg-green-100 text-green-800 border-green-200', 
    maintenance: 'bg-red-100 text-red-800 border-red-200', 
    occupied: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    reserved: 'bg-blue-100 text-blue-800 border-blue-200' 
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto py-8 px-4">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/owner/properties">
            <Button variant="light-circle" className="!w-10 !h-10 p-0 border border-gray-200 shadow-sm"><ChevronLeft size={20}/></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Rooms & Beds</h1>
            <p className="text-gray-500 font-medium">Manage inventory and bed assignments</p>
          </div>
        </div>

        {msg && <div className={`mb-6 p-4 rounded-2xl text-sm font-bold shadow-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Add Room Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="font-extrabold text-lg text-brand-navy mb-6 flex items-center gap-2"><Plus size={18}/> Add Room</h2>
              <form onSubmit={addRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Room Number *</label>
                  <input type="text" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className="pill-input" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Floor</label>
                  <input type="text" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} className="pill-input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Type</label>
                    <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))} className="pill-select w-full">
                      {['single', 'double', 'triple', 'dormitory'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Capacity *</label>
                    <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="pill-input" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rent (₹) *</label>
                    <input type="number" value={form.monthly_rent} onChange={e => setForm(f => ({ ...f, monthly_rent: e.target.value }))} className="pill-input" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Deposit (₹)</label>
                    <input type="number" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} className="pill-input" />
                  </div>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form.is_ac} onChange={e => setForm(f => ({ ...f, is_ac: e.target.checked }))} className="w-4 h-4 accent-brand-orange" /> AC
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form.attached_bath} onChange={e => setForm(f => ({ ...f, attached_bath: e.target.checked }))} className="w-4 h-4 accent-brand-orange" /> Attached Bath
                  </label>
                </div>
                <Button type="submit" className="w-full mt-2">Create Room</Button>
              </form>
            </Card>
          </div>

          {/* Rooms List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-4"><Skeleton className="h-24 w-full rounded-2xl"/><Skeleton className="h-24 w-full rounded-2xl"/></div>
            ) : rooms.length === 0 ? (
              <EmptyState icon={<BedDouble size={48} className="text-gray-300"/>} title="No rooms yet" description="Add your first room from the form to manage beds." />
            ) : (
              <StaggerList className="space-y-4">
                {rooms.map(room => {
                  const isExpanded = !!expandedRooms[room.room_id];
                  return (
                    <Card key={room.room_id} className="p-0 overflow-hidden">
                      {/* Header (Clickable) */}
                      <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpanded(room.room_id)}>
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold border border-indigo-100">
                            {room.room_number}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-brand-navy">Room {room.room_number} <span className="text-xs font-semibold text-gray-400 ml-1 capitalize">({room.room_type})</span></h3>
                            <div className="flex gap-3 text-xs font-semibold text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><BedDouble size={12}/> {room.capacity} Beds</span>
                              <span className="flex items-center gap-1 font-extrabold text-brand-navy">₹{room.monthly_rent}/mo</span>
                              {(room.is_ac || room.attached_bath) && (
                                <span className="flex gap-1 ml-2">
                                  {room.is_ac && <Badge className="!px-1.5 !py-0 !text-[10px] bg-sky-100 text-sky-700">AC</Badge>}
                                  {room.attached_bath && <Badge className="!px-1.5 !py-0 !text-[10px] bg-purple-100 text-purple-700">Bath</Badge>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100 bg-gray-50/50">
                            <div className="p-5">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bed Inventory</h4>
                              {beds[room.room_id] ? (
                                <div className="flex flex-wrap gap-2 mb-6">
                                  {beds[room.room_id].map(bed => (
                                    <div key={bed.bed_id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border shadow-sm ${BED_COLOR[bed.status] || 'bg-gray-100 text-gray-700'}`}>
                                      <div className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center shrink-0">{bed.bed_label}</div>
                                      <span className="uppercase tracking-wider">{bed.status}</span>
                                      {['available', 'maintenance'].includes(bed.status) && (
                                        <button onClick={() => toggleBed(bed.bed_id, bed.status, room.room_id)} className="ml-2 text-[10px] bg-white/60 hover:bg-white px-2 py-1 rounded shadow-sm transition">
                                          {bed.status === 'maintenance' ? 'Unblock' : 'Block'}
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : <Skeleton className="h-10 w-full mb-6" />}

                              {/* Photo Upload */}
                              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                                <div className="flex-1">
                                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:bg-gray-100 file:text-brand-navy file:font-bold hover:file:bg-gray-200 transition-colors w-full" />
                                </div>
                                <Button variant="light-circle" className="!px-4 !py-1.5 !h-auto !text-xs !rounded-lg border border-gray-200 gap-1" onClick={() => uploadPhoto(room.room_id)} disabled={uploadingRoom === room.room_id || !photoFile}>
                                  <UploadCloud size={14}/> {uploadingRoom === room.room_id ? 'Uploading…' : 'Upload'}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </StaggerList>
            )}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
