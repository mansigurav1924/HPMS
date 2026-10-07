import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, PageTransition } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(apiBase + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.access_token, { id: data.user_id, role: data.role, name: data.name || email });
        if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.role === 'owner') {
          navigate('/owner');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-3xl m-4 md:m-8 shadow-float bg-white">
        {/* Brand Side */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-brand-navy to-brand-purple p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-white/5 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, white 10%, transparent 50%)' }}></div>
          <motion.img 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            src="/favicon.svg" alt="Logo" className="w-24 h-24 mb-6 invert opacity-90" 
          />
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold text-white mb-4"
          >
            Welcome back.
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-brand-sky text-lg max-w-md"
          >
            Manage your stays, discover new places, and handle your PG effortlessly.
          </motion.p>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-extrabold text-brand-navy mb-2">Log In</h2>
            <p className="text-gray-500 mb-8 font-medium">Please enter your details to continue.</p>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Email Address</label>
                <input
                  className="pill-input"
                  type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Password</label>
                <input
                  className="pill-input"
                  type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-4">
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
            
            <p className="mt-8 text-sm text-gray-500 text-center font-medium">
              Don't have an account? <Link to="/signup" className="text-brand-orange hover:text-orange-600 font-bold ml-1">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
