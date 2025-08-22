
import React, { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../api';

export default function UsersPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet('/users');
      setList(res.data || res || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function addUser(e) {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await apiPost('/auth/register', { email, password, role });
      setEmail(''); setPassword(''); setRole('developer');
      setOk('User created');
      load();
    } catch (e) { setErr(e.message || 'Failed'); }
  }

  async function removeUser(id) {
    if (!window.confirm('Delete this user?')) return;
    await apiDelete('/users/' + id);
    load();
  }

  const RoleBadge = ({ r }) => (
    <span className={`px-2 py-1 rounded-full text-xs ${r==='developer'?'bg-blue-100 text-blue-700':r==='tester'?'bg-green-100 text-green-700':'bg-purple-100 text-purple-700'}`}>
      {r[0].toUpperCase()+r.slice(1)}
    </span>
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">User Management</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <div className="text-lg font-medium mb-4">Add New User</div>
        <form onSubmit={addUser} className="grid md:grid-cols-4 gap-3">
          <input className="p-3 border rounded-lg" placeholder="Enter username (email)"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="p-3 border rounded-lg" placeholder="Enter password" type="password"
                 value={password} onChange={e=>setPassword(e.target.value)} />
          <select className="p-3 border rounded-lg" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="developer">Developer</option>
            <option value="tester">Tester</option>
            <option value="admin">Admin</option>
          </select>
          <div><button className="px-5 py-3 bg-blue-600 text-white rounded-lg">Add User</button></div>
        </form>
        {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
        {ok && <div className="text-green-600 text-sm mt-2">{ok}</div>}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">User List</div>
          <input className="border rounded-lg p-2 text-sm" placeholder="Search users…" onChange={(e)=>{
            const q=e.target.value.toLowerCase();
            const base = (list.data || list) ?? list;
            const arr = Array.isArray(base)?base:[];
            setList(arr.filter(u => (u.email||'').toLowerCase().includes(q)));
          }} />
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-2">Username</th>
              <th className="py-2">Password</th>
              <th className="py-2">Role</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && (Array.isArray(list)?list:[]).map(u=>(
              <tr key={u._id} className="border-b">
                <td className="py-3">{u.email}</td>
                <td className="py-3">********</td>
                <td className="py-3"><RoleBadge r={u.role} /></td>
                <td className="py-3 text-right">
                  <button onClick={()=>removeUser(u._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {loading && <tr><td className="py-6 text-gray-400">Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
