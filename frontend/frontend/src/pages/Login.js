import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';

const Login=()=>{
  const [email,setEmail]=useState('');
   const [password,setPassword]=useState('');
  const [err,setErr]=useState('');
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    setErr('');
    try {
      const data = await apiPost('/auth/login', { email, password });
      const token = data.accessToken || data.token || data.token;
      const role = data.role || data.user?.role || 'admin';
      if (!token) throw new Error('Login failed');
      localStorage.setItem('token', token); localStorage.setItem('role', role);
      nav('/dashboard');
    } catch (e) { setErr(e.message || 'Login failed'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl mb-4">Login</h2>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full p-2 border rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full p-2 border rounded" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
          {err && <div className="text-red-600">{err}</div>}
        </form>
        <p className="text-sm mt-2 text-gray-500">Use seeded admin or created users.</p>
      </div>
    </div>
  )
}
export default Login