// One place for all backend calls. Always returns friendly error messages.
const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'eldercare_token';
const NETWORK_MSG = "I can't reach the internet right now. Please check your connection and try again.";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, form, timeoutMs = 30000 } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form; // browser sets the multipart boundary
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: payload, signal: controller.signal });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'This is taking too long. Please try again.' : NETWORK_MSG, 0);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      clearToken();
      window.dispatchEvent(new Event('eldercare:unauthorized'));
    }
    throw new ApiError(data?.error?.message || 'Something went wrong. Please try again.', res.status);
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  upload: (p, form) => request(p, { method: 'POST', form, timeoutMs: 70000 }),
};
