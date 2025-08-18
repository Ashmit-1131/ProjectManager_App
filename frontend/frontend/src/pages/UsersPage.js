import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';

const UsersPage=()=>{
  const [users, setUsers] = useState([]);
  const [email,setEmail]=useState(''); 
  const [password,setPassword]=useState('');
   const [role,setRole]=useState('tester');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{ load(); }, []);
  async function load(){
    try {
      setLoading(true);
      const res = await apiGet('/users');
      setUsers(res.data || res);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function create(e){
    e.preventDefault();
    try {
      await apiPost('/users', { email, password, role });
      setEmail(''); setPassword(''); setRole('tester');
      load();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to create user');
    }
  }

  async function remove(id){
    // use window.confirm (avoids ESLint no-restricted-globals error)
    if (!window.confirm('Delete user?')) return;
    try {
      await apiDelete('/users/' + id);
      load();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to delete user');
    }
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">User Management</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="bg-white p-4 rounded shadow mb-6">
        <form className="grid grid-cols-3 gap-3" onSubmit={create}>
          <input className="p-2 border rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="p-2 border rounded" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <select className="p-2 border rounded" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="tester">tester</option>
            <option value="developer">developer</option>
            <option value="admin">admin</option>
          </select>
          <div className="col-span-3 text-right">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Add User</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="mb-3 font-semibold">User List</h3>

        {loading ? <div>Loading...</div> : (
          <table className="w-full">
            <thead><tr className="text-left border-b"><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => <tr key={u._id} className="hover:bg-gray-50">
                <td className="py-2">{u.email}</td>
                <td>{u.role}</td>
                <td><button className="text-red-600" onClick={()=>remove(u._id)}>Delete</button></td>
              </tr>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
export default UsersPage
