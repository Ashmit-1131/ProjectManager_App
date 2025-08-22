
import React, { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api';

export default function ProjectsPage() {
  const role = localStorage.getItem('role') || 'admin';
  const isAdmin = role === 'admin';

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // for assigning

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [assignIds, setAssignIds] = useState([]);

  async function load() {
    const path = isAdmin ? '/projects' : '/projects/my-projects';
    const res = await apiGet(path);
    setProjects(res.data || res || []);
    if (isAdmin) {
      const u = await apiGet('/users');
      setUsers(u.data || u || []);
    } else {
      // still fetch users list for modal (admin only opens modal)
      try {
        const u = await apiGet('/users');
        setUsers(u.data || u || []);
      } catch {}
    }
  }

  useEffect(()=>{ load(); }, [isAdmin]);

  async function addProject(e) {
    e.preventDefault();
    const res = await apiPost('/projects', { name, description, members: [] });
    setName(''); setDescription('');
    setProjects([res, ...projects]);
  }

  async function delProject(id) {
    if (!window.confirm('Delete project?')) return;
    await apiDelete('/projects/' + id);
    setProjects(projects.filter(p => p._id !== id));
  }

  function openEdit(p) {
    setEditProject(p);
    setAssignIds(p.members?.map(String) || []);
    setEditOpen(true);
  }

  async function saveMembers() {
    const add = assignIds;
    await apiPatch(`/projects/${editProject._id}/members`, { add, remove: [] });
    setEditOpen(false);
    load();
  }

  const devsAndTesters = useMemo(
    () => (Array.isArray(users) ? users.filter(u => u.role === 'developer' || u.role === 'tester') : []),
    [users]
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Projects</h2>

      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <form onSubmit={addProject} className="grid gap-3">
            <input className="p-3 border rounded-lg" placeholder="Project name"
                   value={name} onChange={e=>setName(e.target.value)} />
            <textarea className="p-3 border rounded-lg" rows={3} placeholder="Enter project description"
                      value={description} onChange={e=>setDescription(e.target.value)} />
            <div>
              <button className="px-5 py-3 bg-blue-600 text-white rounded-lg">Add Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-2">Project Name</th>
              <th className="py-2">Description</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(projects)?projects:[]).map(p=>(
              <tr key={p._id} className="border-b">
                <td className="py-3">{p.name}</td>
                <td className="py-3 text-gray-600">{p.description || '—'}</td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button onClick={()=>openEdit(p)} className="text-blue-600 hover:underline">✎ Edit</button>
                    {isAdmin && (
                      <button onClick={()=>delProject(p._id)} className="text-red-600 hover:underline">🗑 Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {projects.length===0 && <tr><td className="py-6 text-gray-400">No projects</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Edit members modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6">
            <div className="text-lg font-semibold mb-4">Assign Members</div>
            <div className="space-y-2 max-h-80 overflow-auto border rounded-lg p-3">
              {devsAndTesters.map(u=>(
                <label key={u._id} className="flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={assignIds.includes(String(u._id))}
                    onChange={(e)=>{
                      const id = String(u._id);
                      setAssignIds(s => e.target.checked ? [...s, id] : s.filter(x => x!==id));
                    }}
                  />
                  <span className="text-sm">{u.email} <em className="text-gray-400">({u.role})</em></span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={()=>setEditOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={saveMembers} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
