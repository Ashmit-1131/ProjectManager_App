import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';

const ModulesPage = () => {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [modules, setModules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('modules') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    load();
  }, []);
  async function load() {
    const p = await apiGet('/projects');
    setProjects(p.data || p);
  }
  function addModule(e) {
    e.preventDefault();
    const mod = { id: Date.now().toString(), projectId: selected, name };
    const next = [mod, ...modules];
    setModules(next);
    localStorage.setItem('modules', JSON.stringify(next));
    setName('');
  }
  return (
    <div>
      <h2 className="text-2xl mb-4">Module Management</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <form className="grid grid-cols-1 gap-3" onSubmit={addModule}>
          <select className="p-2 border rounded" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Choose a project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <input className="p-2 border rounded" placeholder="Module name" value={name} onChange={e => setName(e.target.value)} />
          <div className="text-left"><button className="px-4 py-2 bg-blue-600 text-white rounded">Add</button></div>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="mb-3 font-semibold">Modules</h3>
        <table className="w-full">
          <thead><tr className="text-left border-b"><th>Project</th><th>Module Name</th></tr></thead>
          <tbody>
            {modules.map(m => <tr key={m.id}><td>{projects.find(p => p._id === m.projectId)?.name || '—'}</td><td>{m.name}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ModulesPage