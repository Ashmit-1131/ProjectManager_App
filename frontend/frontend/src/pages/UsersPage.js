import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';
import { useNavigate } from 'react-router-dom';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tester');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const myRole = localStorage.getItem('role') || '';

  useEffect(() => {
    // defence-in-depth: redirect non-admins away
    if (myRole !== 'admin') { navigate('/dashboard', { replace: true }); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await apiGet('/users');
      // the API might return { data: [...] } or an array directly
      setUsers(res.data || res);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function create(e) {
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

  async function remove(id) {
    if (!window.confirm('Delete user?')) return;
    try {
      await apiDelete('/users/' + id);
      load();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to delete user');
    }
  }

  // filtered list (client side). Matches id, email, username or role (case insensitive)
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase().trim();
    return users.filter(u => {
      const fields = [
        u.email || '',
        u.role || '',
        u._id || '',
        u.username || ''      // if your API returns username
      ];
      return fields.some(f => f.toLowerCase().includes(s));
    });
  }, [users, searchTerm]);

  return (
    <div>
      <h2 className="text-2xl mb-4">User Management</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Add user form only visible to admin (route already protected as well) */}
      {myRole === 'admin' && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <form className="grid grid-cols-3 gap-3" onSubmit={create}>
            <input
              className="p-2 border rounded"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="p-2 border rounded"
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <select
              className="p-2 border rounded"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="tester">tester</option>
              <option value="developer">developer</option>
              <option value="admin">admin</option>
            </select>
            <div className="col-span-3 text-right">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Add User</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded shadow">
        {/* header + search (search on the right) */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">User List</h3>
          <div className="w-64">
            <input
              className="w-full p-2 border rounded placeholder-gray-400"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? <div>Loading...</div> : (
          <>
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-gray-600">No users found.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">ID</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="py-2 break-words max-w-xs">{u._id}</td>
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">
                        {/* small pill style for role to look similar to screenshot */}
                        <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2">
                        {myRole === 'admin'
                          ? <button className="text-red-600" onClick={() => remove(u._id)}>Delete</button>
                          : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
