import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('pl_access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      try {
        const favRes = await api.get('/favorites/ids');
        setFavoriteIds(favRes.data.favorite_ids || []);
      } catch {}
    } catch {
      localStorage.removeItem('pl_access_token');
      localStorage.removeItem('pl_refresh_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password, turnstile_token) => {
    const payload = { email, password };
    if (turnstile_token) payload.turnstile_token = turnstile_token;
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('pl_access_token', data.access_token);
    localStorage.setItem('pl_refresh_token', data.refresh_token);
    setUser(data.user);
    try {
      const favRes = await api.get('/favorites/ids');
      setFavoriteIds(favRes.data.favorite_ids || []);
    } catch {}
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload, {
      headers: { 'x-frontend-origin': window.location.origin }
    });
    localStorage.setItem('pl_access_token', data.access_token);
    localStorage.setItem('pl_refresh_token', data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('pl_access_token');
    localStorage.removeItem('pl_refresh_token');
    setUser(null);
    setFavoriteIds([]);
  };

  const toggleFavorite = async (listingId) => {
    if (!user) return false;
    try {
      const { data } = await api.post(`/favorites/${listingId}`);
      if (data.favorited) {
        setFavoriteIds(prev => [...prev, listingId]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== listingId));
      }
      return data.favorited;
    } catch {
      return false;
    }
  };

  const isFavorited = (listingId) => favoriteIds.includes(listingId);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, toggleFavorite, isFavorited, favoriteIds }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
