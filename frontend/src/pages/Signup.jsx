import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck, Sparkles, Calendar,
  Building2, GraduationCap, CheckCircle2, ArrowRight
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import { PageTransition, Button } from '../components/ui';

export default function Signup() {
  const [formData, setFormData] = useState({
    role: 'student',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'male',
    consent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const strengthColors = ['bg-gray-200', 'bg-rose-500', 'bg-amber-500', 'bg-primary-500', 'bg-emerald-500'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!formData.consent) {
      setErrorMsg("Please accept the Terms of Service & Privacy Policy to continue.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const payload = {
        role: formData.role,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        dob: formData.dob || '2000-01-01',
        gender: formData.gender,
        consent: true,
        consent_version: 'v1',
        turnstile_token: 'dummy-token-for-dev',
      };

      const res = await fetch(apiBase + '/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1800);
      } else {
        let msg = data.detail;
        if (Array.isArray(msg)) msg = msg.map((err) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        setErrorMsg(msg || data.message || 'Signup failed. Please check your information.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend server running?');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F5F6FF] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-5xl min-h-[660px] bg-white rounded-3xl shadow-float border border-gray-100 overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Visual Panel */}
          <div className="hidden md:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#141B42] to-primary-950 text-white">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity scale-105"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80')`,
              }}
            />
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <Logo to="/" tone="light" />

              <div className="mt-16">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-primary-200 backdrop-blur border border-white/15">
                  <Sparkles size={12} /> {formData.role === 'student' ? 'Student Stay Network' : 'Hostel Partner Network'}
                </span>
                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mt-4 leading-tight">
                  {formData.role === 'student' ? 'Find Your Best College Stay.' : 'Scale Your PG Business.'}
                </h2>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-sm">
                  {formData.role === 'student'
                    ? 'Join thousands of students finding verified hostels, safe roommates, and zero-brokerage stays.'
                    : 'List your rooms, manage bed inventory, collect rent records, and handle student requests seamlessly.'}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-8 space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Verified profiles with digital agreements</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Zero commission, direct communication</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>24/7 student support & grievance redressal</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="w-full md:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center overflow-y-auto max-h-[92vh] md:max-h-none">
            <div className="md:hidden mb-6">
              <Logo to="/" />
            </div>

            <div className="max-w-md mx-auto w-full">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">Create Account</h1>
                <p className="text-gray-500 text-sm mt-1">Get started in under 2 minutes with HPMS.</p>
              </div>

              {/* Role selection tab pills */}
              <div className="bg-gray-100/80 p-1 rounded-2xl flex gap-1 mb-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: 'student' }))}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    formData.role === 'student' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <GraduationCap size={16} />
                  <span>I'm a Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: 'owner' }))}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    formData.role === 'owner' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Building2 size={16} />
                  <span>I'm a Property Owner</span>
                </button>
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <motion.form
                onSubmit={handleSubmit}
                animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="space-y-3.5"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User size={16} className="absolute left-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      className="field-input !pl-10 !h-11 !rounded-2xl"
                    />
                  </div>
                </div>

                {/* Email & Phone in 2 cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                      Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="field-input !pl-10 !h-11 !rounded-2xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={16} className="absolute left-3.5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="10-digit number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="field-input !pl-10 !h-11 !rounded-2xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Student specific gender and DOB */}
                {formData.role === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="field-input !h-11 !rounded-2xl text-xs capitalize cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="field-input !h-11 !rounded-2xl text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3.5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="field-input !pl-10 !pr-9 !h-11 !rounded-2xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">
                      Confirm
                    </label>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3.5 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="field-input !pl-10 !pr-9 !h-11 !rounded-2xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            strength >= step ? strengthColors[strength] : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Password strength: <span className="font-bold text-gray-700">{strengthLabels[strength]}</span>
                    </p>
                  </div>
                )}

                {/* Consent Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 leading-snug">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={formData.consent}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 accent-primary-600 shrink-0"
                    />
                    <span>
                      I agree to the{' '}
                      <a href="#terms" className="font-semibold text-primary-600 hover:underline">Terms of Service</a>{' '}
                      and{' '}
                      <a href="#privacy" className="font-semibold text-primary-600 hover:underline">Privacy Policy</a>.
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full !py-3.5 !rounded-2xl text-sm font-bold shadow-glow flex items-center justify-center gap-2"
                  >
                    <span>Create {formData.role === 'student' ? 'Student' : 'Owner'} Account</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </motion.form>

              <div className="mt-6 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-primary-600 hover:text-primary-800 ml-1">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
