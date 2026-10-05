import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

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
        navigate('/');
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
    <div className="max-w-md mx-auto mt-16 bg-white p-8 border shadow-sm rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
        />
        <input
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required
        />
        <button
          className="bg-indigo-600 text-white p-2 rounded font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          type="submit" disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600 text-center">
        Don't have an account? <Link to="/signup" className="text-indigo-600 font-semibold">Sign Up</Link>
      </p>
    </div>
  );
}
