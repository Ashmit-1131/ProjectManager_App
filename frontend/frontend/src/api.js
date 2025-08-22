// src/api.js
const API_BASE = process.env.REACT_APP_API_BASE || 'https://projectmanager-app-1.onrender.com/api/v1';

async function request(path, opts = {}) {
  const headers = opts.headers || {};
  if (opts.body) headers['Content-Type'] = headers['Content-Type'] || 'application/json';

  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;

  console.debug('[api] Request:', {
    url: API_BASE + path,
    method: opts.method || 'GET',
    headers,
    body: opts.body,
  });

  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error('[api] Error response:', res.status, data);
    const err = new Error((data && data.message) || res.statusText);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export const apiGet = (p) => request(p, { method: 'GET' });
export const apiPost = (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (p) => request(p, { method: 'DELETE' });

// Always pick the right endpoint based on role
export const meProjectsPath = () => {
  const role = localStorage.getItem('role');
  return role === 'admin' ? '/projects' : '/projects/my-projects';
};
