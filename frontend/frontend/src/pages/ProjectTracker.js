import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../api';

const allowedTransitions = {
  open: ['solved'],
  solved: ['closed','reopened'],
  closed: ['reopened'],
  reopened: ['solved']
};

export default function ProjectTracker(){
  const { id } = useParams(); // project id
  const [project, setProject] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [modules, setModules] = useState([]);

  useEffect(()=>{ load(); loadModules(); }, [id]);

  async function load(){
    try {
      const p = await apiGet('/projects/' + id);
      setProject(p);
      const b = await apiGet('/projects/' + id + '/bugs');
      setBugs(b.data || b);
    } catch (e) {
      console.error(e);
    }
  }

  function loadModules(){
    try {
      const m = JSON.parse(localStorage.getItem('modules') || '[]');
      const projectModules = m.filter(x => x.projectId === id);
      setModules(projectModules);
    } catch { setModules([]); }
  }

  async function createBug(e){
    e.preventDefault();
    try {
      const ass = assignee ? [assignee] : [];
      await apiPost('/projects/' + id + '/bugs', { title, description, assignees: ass });
      setTitle(''); setDescription(''); setAssignee('');
      load();
    } catch (err) {
      alert(err.message || 'Failed to create bug');
    }
  }

  async function changeStatus(bugId, from, to){
    try {
      await apiPatch('/bugs/' + bugId + '/status', { from, to });
      load();
    } catch (err) {
      alert(err.body?.message || err.message || 'Status change failed');
    }
  }

  if (!project) return <div>Loading project...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{project.name}</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="mb-2 font-semibold">Create New Bug</h3>
        <form onSubmit={createBug} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Module</label>
            <select className="p-2 border rounded w-64" value={/* no module saved in backend: show modules for context */ ''} onChange={()=>{}}>
              <option value="">Select a module</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Title</label>
            <input className="w-full p-2 border rounded" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Short title" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Description</label>
            <textarea className="w-full p-2 border rounded" rows="4" value={description} onChange={e=>setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Assign to</label>
            <select className="p-2 border rounded w-64" value={assignee} onChange={e=>setAssignee(e.target.value)}>
              <option value="">— none —</option>
              {(project.members || []).map(m => <option key={m._id} value={m._id}>{m.email || m._id}</option>)}
            </select>
          </div>

          <div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Bug</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="mb-3 font-semibold">Bugs</h3>
        <table className="w-full">
          <thead><tr className="text-left border-b"><th>Title</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {bugs.map(b => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="py-2">{b.title}</td>
                <td>{b.description}</td>
                <td>
                  <Badge status={b.status} />
                </td>
                <td>
                  {renderActions(b, changeStatus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ status }){
  const map = {
    open: 'bg-green-100 text-green-800',
    solved: 'bg-indigo-100 text-indigo-800',
    closed: 'bg-red-100 text-red-800',
    reopened: 'bg-yellow-100 text-yellow-800'
  };
  return <span className={`px-2 py-1 rounded-full text-sm ${map[status] || 'bg-gray-100'}`}>{status}</span>;
}

function renderActions(bug, changeStatus){
  const buttons = [];
  const s = bug.status;
  const push = (label, to) => buttons.push(<button key={to} onClick={()=>changeStatus(bug._id, s, to)} className="ml-2 px-3 py-1 rounded bg-blue-600 text-white">{label}</button>);

  if (s === 'open') push('Mark Solved', 'solved');
  if (s === 'solved') {
    push('Close', 'closed');
    push('Reopen', 'reopened');
  }
  if (s === 'closed') push('Reopen', 'reopened');
  if (s === 'reopened') push('Mark Solved', 'solved');

  return <div>{buttons}</div>;
}
