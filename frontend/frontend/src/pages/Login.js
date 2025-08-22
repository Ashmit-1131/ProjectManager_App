
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';

export default function Login() {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    setErr('');
    try {
      const data = await apiPost('/auth/login', { email, password });
      const token = data.accessToken || data.token;
      const role = data.role || data.user?.role;
      const userId = data.user?._id || data.userId;

      if (!token) throw new Error('Login failed');

      localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      if (userId) localStorage.setItem('userId', userId);

      nav('/dashboard');
    } catch (e) {
      setErr(e.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full p-3 border rounded-lg" placeholder="Email"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full p-3 border rounded-lg" placeholder="Password"
                 value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 text-white p-3 rounded-lg">Login</button>
          {err && <div className="text-red-600 text-sm">{err}</div>}
        </form>
        <p className="text-xs mt-3 text-gray-500">Use your seeded admin/tester/developer users.</p>
      </div>
    </div>
  );
}
