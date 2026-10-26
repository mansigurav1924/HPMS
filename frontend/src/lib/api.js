import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Thin fetch wrapper that adds the bearer token and throws readable errors. */
export async function apiFetch(path, token, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {}),
    },
  });
  let payload = null;
  const text = await res.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!res.ok) {
    const detail = payload && (payload.detail || payload.message);
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${res.status})`);
  }
  return payload;
}

/**
 * GET data for the current user.
 * `path` may be null to skip. Returns { data, loading, error, reload }.
 */
export function useApi(path) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    setError(null);
    apiFetch(path, token)
      .then((d) => alive.current && setData(d))
      .catch((e) => alive.current && setError(e.message))
      .finally(() => alive.current && setLoading(false));
  }, [path, token]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { data, loading, error, reload: load };
}

export const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatINR = (n) =>
  n === null || n === undefined || n === '' ? '—' : '₹' + Number(n).toLocaleString('en-IN');
