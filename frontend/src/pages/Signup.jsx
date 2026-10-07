import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, PageTransition, PillSelect } from '../components/ui';

export default function Signup() {
  const [formData, setFormData] = useState({
    role: 'student', name: '', email: '', phone: '', password: '', dob: '', gender: 'male', consent: false
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.consent) return setErrorMsg("You must consent to Terms and Conditions.");
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(apiBase + '/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          consent_version: 'v1',
          turnstile_token: 'dummy-token-for-dev'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Signup successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        let msg = data.detail;
        if (Array.isArray(msg)) msg = msg.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        setErrorMsg(msg || data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-3xl m-4 md:m-8 shadow-float bg-white">
        
        {/* Form Side */}
        <div className="w-full lg:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white overflow-y-auto no-scrollbar">
          <div className="max-w-md mx-auto w-full py-8">
            <h2 className="text-3xl font-extrabold text-brand-navy mb-2">Create Account</h2>
            <p className="text-gray-500 mb-8 font-medium">Join us to find your perfect stay or manage your properties.</p>
            
            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                  {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-sm font-semibold">
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Segmented Control for Role */}
              <div className="bg-gray-100 p-1 rounded-full flex relative w-full mb-2 shadow-inner">
                {['student', 'owner'].map(role => (
                  <button
                    key={role} type="button"
                    onClick={() => setFormData(p => ({ ...p, role }))}
                    className={`flex-1 py-2 text-sm font-bold capitalize rounded-full z-10 transition-colors ${formData.role === role ? 'text-brand-navy' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {role}
                  </button>
                ))}
                <motion.div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm z-0"
                  animate={{ left: formData.role === 'student' ? '4px' : 'calc(50%)' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Full Name</label>
                  <input name="name" className="pill-input" placeholder="John Doe" onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Phone</label>
                  <input name="phone" className="pill-input" placeholder="+91 9876543210" onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Email Address</label>
                <input name="email" type="email" className="pill-input" placeholder="you@example.com" onChange={handleChange} required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Password</label>
                <input name="password" type="password" className="pill-input" placeholder="••••••••" onChange={handleChange} required minLength={6} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Date of Birth</label>
                  <input name="dob" type="date" className="pill-input" onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Gender</label>
                  <PillSelect name="gender" value={formData.gender} onChange={handleChange} className="w-full">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </PillSelect>
                </div>
              </div>

              <label className="flex items-center gap-3 mt-2 cursor-pointer group">
                <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} required className="w-5 h-5 rounded text-brand-orange focus:ring-brand-orange accent-brand-orange" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-brand-navy transition">I consent to the Terms and Conditions (v1)</span>
              </label>
              
              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
            
            <p className="mt-8 text-sm text-gray-500 text-center font-medium pb-8">
              Already have an account? <Link to="/login" className="text-brand-orange hover:text-orange-600 font-bold ml-1">Log In</Link>
            </p>
          </div>
        </div>

        {/* Brand Side */}
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-brand-purple to-brand-navy p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-white/5 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 10%, transparent 50%)' }}></div>
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}
            src="/favicon.svg" alt="Logo" className="w-32 h-32 mb-8 invert opacity-90 drop-shadow-2xl" 
          />
          <motion.h2 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold text-white mb-4 leading-tight"
          >
            Start your journey<br/>with us today.
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-brand-sky text-lg max-w-md"
          >
            Find the perfect hostel, connect with owners, and enjoy a seamless living experience.
          </motion.p>
        </div>

      </div>
    </PageTransition>
  );
}
