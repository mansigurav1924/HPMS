import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { PageTransition, Modal, Button } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(() =>
    sessionStorage.getItem('hpms_session_expired') ? 'Your session expired. Please sign in again.' : ''
  );
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [roleHint, setRoleHint] = useState('student'); // Visual tab to guide user
  
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    sessionStorage.removeItem('hpms_session_expired');
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(apiBase + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.access_token, { id: data.user_id, role: data.role, name: data.name || email });
        if (data.role === 'admin') navigate('/admin');
        else if (data.role === 'owner') navigate('/owner');
        else navigate('/student/dashboard');
      } else {
        setError(data.detail || 'Invalid email or password. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError('Cannot connect to authentication service. Is the backend running?');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await fetch(apiBase + `/auth/password-reset?email=${encodeURIComponent(forgotEmail)}`, { method: 'POST' });
      setForgotDone(true);
    } catch (err) {
      setError('Error requesting password reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F5F6FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-5xl min-h-[620px] bg-white rounded-3xl shadow-float border border-gray-100 overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Visual Panel */}
          <div className="hidden md:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#141B42] to-primary-950 text-white">
            {/* Background image overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80')` }}
            />
            {/* Ambient gradients */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Logo to="/" tone="light" />
              
              <div className="mt-16">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-primary-200 backdrop-blur border border-white/15">
                  <Sparkles size={12} /> Modern SaaS Platform
                </span>
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mt-4 leading-tight">
                  Welcome to Your Stay Portal.
                </h2>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-sm">
                  Sign in to access your verified bookings, monitor tenancy dues, submit maintenance requests, or manage your properties.
                </p>
              </div>
            </div>

            {/* Testimonial / verified card */}
            <div className="relative z-10 mt-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/30 flex items-center justify-center shrink-0 text-primary-300">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">100% Verified Accommodation</p>
                  <p className="text-[11px] text-gray-300">Direct booking with owners. Zero brokerage.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="md:hidden mb-8">
              <Logo to="/" />
            </div>

            <div className="max-w-md mx-auto w-full">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">Sign In</h1>
                <p className="text-gray-500 text-sm mt-1">Please enter your account credentials to continue.</p>
              </div>

              {/* Role selection tab indicator */}
              <div className="bg-gray-100/80 p-1 rounded-2xl flex gap-1 mb-6 text-xs font-bold">
                {[
                  { id: 'student', label: 'Student' },
                  { id: 'owner', label: 'Owner / Warden' },
                  { id: 'admin', label: 'Admin' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setRoleHint(t.id)}
                    className={`flex-1 py-2 rounded-xl transition-all ${
                      roleHint === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Error Feedback */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <motion.form 
                onSubmit={handleSubmit}
                animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder={roleHint === 'admin' ? 'admin@hpms.com' : 'you@example.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field-input !pl-11 !h-12 !rounded-2xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock size={18} className="absolute left-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-input !pl-11 !pr-11 !h-12 !rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 accent-primary-600"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotModal(true); setForgotDone(false); setForgotEmail(email); }}
                    className="font-bold text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full !py-3.5 !rounded-2xl text-sm font-bold shadow-glow flex items-center justify-center gap-2"
                  >
                    <span>Sign In to HPMS</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </motion.form>

              <div className="mt-8 text-center text-xs text-gray-500">
                Don't have an account yet?{' '}
                <Link to="/signup" className="font-bold text-primary-600 hover:text-primary-800 ml-1">
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={forgotModal} onClose={() => setForgotModal(false)} title="Reset Password">
        {forgotDone ? (
          <div className="py-4 text-center">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500 mb-3" />
            <h3 className="font-bold text-brand-navy text-lg">Reset Link Sent</h3>
            <p className="text-sm text-gray-500 mt-1">
              If an account with that email exists, password reset instructions have been dispatched.
            </p>
            <Button className="mt-5 w-full" onClick={() => setForgotModal(false)}>
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email address</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="field-input"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setForgotModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={forgotLoading}>
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </PageTransition>
  );
}
