import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const SESSION_EXPIRED_KEY = 'hpms_session_expired';

/** True when a JWT's `exp` claim is in the past (or the token is unreadable). */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 5000;
  } catch {
    return true;
  }
}

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/** Read the saved session synchronously so protected routes don't bounce on refresh. */
function loadSession() {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return { token: null, user: null };
    if (isTokenExpired(token)) {
      clearStoredSession();
      sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
      return { token: null, user: null };
    }
    return { token, user: JSON.parse(user) };
  } catch {
    clearStoredSession();
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const { user, token } = session;

  const login = (newToken, newUser) => {
    setSession({ token: newToken, user: newUser });
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  };

  const logout = () => {
    setSession({ token: null, user: null });
    clearStoredSession();
  };

  // If the backend rejects our token (expired / invalid), end the session and
  // send the user to the login page instead of leaving pages stuck on errors.
  useEffect(() => {
    const originalFetch = window.fetch;
    let redirecting = false;

    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401 && !redirecting) {
        const input = args[0];
        const url = typeof input === 'string' ? input : input?.url || '';
        const isApiCall = url.startsWith(API_BASE);
        const isAuthCall = url.includes('/auth/');
        if (isApiCall && !isAuthCall && localStorage.getItem('token')) {
          redirecting = true;
          clearStoredSession();
          sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
          window.location.assign('/login');
        }
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
