import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${API_BASE}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pl_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('pl_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API}/auth/refresh`, { refresh_token: refreshToken });
          localStorage.setItem('pl_access_token', data.access_token);
          localStorage.setItem('pl_refresh_token', data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.removeItem('pl_access_token');
          localStorage.removeItem('pl_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export function getMediaUrl(media) {
  if (!media) return '';
  if (media.is_external && media.url) return media.url;
  if (media.storage_path) return `${API}/files/${media.storage_path}`;
  if (media.url) return media.url;
  return '';
}

export function getCoverImage(mediaArray) {
  if (!mediaArray || mediaArray.length === 0) return '';
  const cover = mediaArray.find(m => m.is_cover);
  return getMediaUrl(cover || mediaArray[0]);
}
