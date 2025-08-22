import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function ModulesPage() {
  const role = localStorage.getItem('role') || 'admin';
  const isAdmin = role === 'admin';
  const isTester = role === 'tester';
  const canCreate = isAdmin || isTester;

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [name, setName] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadProjects() {
    const path = isAdmin ? '/projects' : '/projects/my-projects';
    const res = await apiGet(path);
    const list = res.data || res || [];
    setProjects(Array.isArray(list) ? list : []);
  }

  async function loadModules(pid) {
    if (!pid) {
      setModules([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet(`/projects/${pid}/modules`);
      const list = res.data?.data || res.data || res || [];
      setModules(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [isAdmin, isTester]);

  useEffect(() => {
    loadModules(selectedProject);
  }, [selectedProject]);

  async function addModule(e) {
    e.preventDefault();
    if (!selectedProject || !name) return;
    try {
      const res = await apiPost(`/projects/${selectedProject}/modules`, { name });
      const newMod = res.data?.data;
      if (newMod) {
        setModules(prev => [newMod, ...prev]);
        setName('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Module Management</h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <form className="grid gap-3" onSubmit={addModule}>
          <select
            className="p-3 border rounded-lg"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">Choose a project</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          {canCreate ? (
            <>
              <input
                className="p-3 border rounded-lg"
                placeholder="Enter module name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-blue-600 text-white rounded-lg"
                >
                  Add
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">
              Developers can’t create modules.
            </div>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="font-semibold mb-3">Modules</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="py-2">Project</th>
              <th className="py-2">Module Name</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="py-6 text-gray-400">Loading…</td></tr>
            )}
            {!loading && modules.map(m => (
              <tr key={m._id} className="border-b">
                <td className="py-3">{m.project?.name || '—'}</td>
                <td className="py-3">{m.name}</td>
              </tr>
            ))}
            {!loading && modules.length === 0 && selectedProject && (
              <tr><td className="py-6 text-gray-400">No modules</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
