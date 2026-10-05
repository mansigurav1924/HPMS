import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        if (Array.isArray(msg)) {
          // FastAPI 422 validation error list
          msg = msg.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        }
        setErrorMsg(msg || data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 border shadow-sm rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Sign Up</h2>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          ❌ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">
          ✅ {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Account Type</label>
          <select name="role" value={formData.role} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="student">Student</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <input name="name" className="border p-2 rounded" placeholder="Full Name" onChange={handleChange} required />
        <input name="email" type="email" className="border p-2 rounded" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" className="border p-2 rounded" placeholder="Password (min 6 chars)" onChange={handleChange} required minLength={6} />
        <input name="phone" className="border p-2 rounded" placeholder="Phone" onChange={handleChange} required />
        <input name="dob" type="date" className="border p-2 rounded" onChange={handleChange} required />
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} required />
          I consent to the Terms and Conditions (v1)
        </label>
        
        {/* Turnstile Widget Placeholder */}
        <div className="bg-gray-100 p-3 text-center text-xs text-gray-500 border rounded">Turnstile CAPTCHA Widget (Dev Mode)</div>
        
        <button
          disabled={loading}
          className="bg-indigo-600 text-white p-2 rounded font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          type="submit"
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
