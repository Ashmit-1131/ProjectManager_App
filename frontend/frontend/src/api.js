const API_BASE = process.env.REACT_APP_API_BASE ||'https://projectmanager-app.onrender.com/api/v1'

async function request(path, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch(e) { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.message) || res.statusText);
    err.status = res.status; err.body = data;
    throw err;
  }
  return data;
}

export const apiGet = (p) => request(p, { method: 'GET' });
export const apiPost = (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = (p, body) => request(p, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (p) => request(p, { method: 'DELETE' });
