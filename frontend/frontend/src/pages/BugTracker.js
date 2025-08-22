import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet, apiPatch, apiPost } from '../api';

const StatusPill = ({ status }) => {
  const map = {
    open: 'bg-green-100 text-green-700',
    solved: 'bg-blue-100 text-blue-700',
    closed: 'bg-purple-100 text-purple-700',
    reopened: 'bg-yellow-100 text-yellow-800'
  };
  return <span className={`px-2 py-1 text-xs rounded-full ${map[status] || 'bg-gray-100'}`}>{status}</span>;
};

export default function BugTracker() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const role = localStorage.getItem('role') || 'admin';
  const userId = localStorage.getItem('userId');

  const isAdmin = role === 'admin';
  const isTester = role === 'tester';
  const isDeveloper = role === 'developer';
  const canCreate = isAdmin || isTester;

  const [project, setProject] = useState(null);
  const [modules, setModules] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [users, setUsers] = useState([]);

  const [moduleId, setModuleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState([]);

  async function loadAll() {
    try {
      const [pRes, mRes, uRes] = await Promise.all([
        apiGet(`/projects/${projectId}`),
        apiGet(`/projects/${projectId}/modules`),
        apiGet('/users').catch(() => ({ data: [] })),
      ]);

      const proj = pRes?.data ?? pRes;
      setProject(proj);
      setModules(mRes?.data ?? mRes ?? []);
      setUsers(uRes?.data ?? uRes ?? []);
      await loadBugs();

      // Membership check
      // if (proj) {
      //   const memberIds = (proj.members || []).map(m => String(m?._id ?? m));
      //   const requesterId = String(userId ?? '');
      //   if ((isTester || isDeveloper) && !memberIds.includes(requesterId)) {
      //     alert('You are not assigned to this project');
      //     // navigate('/dashboard');
      //   }
      // }
    } catch (err) {
      console.error(err);
      alert('Failed to load project details');
      navigate('/dashboard');
    }
  }

  async function loadBugs() {
    try {
      const res = await apiGet(`/projects/${projectId}/bugs`);
      setBugs(res?.data ?? res ?? []);
    } catch (err) {
      console.error(err);
      setBugs([]);
    }
  }

  useEffect(() => {
    loadAll();
  }, [projectId]);

  const projectMembers = useMemo(() => {
    const memberIds = (project?.members || []).map(m => String(m?._id ?? m));
    return (Array.isArray(users) ? users : []).filter(u => memberIds.includes(String(u._id)));
  }, [users, project]);

  async function createBug(e) {
    e.preventDefault();
    if (!moduleId || !title) return;
    try {
      const payload = { title, description, assignees };
      await apiPost(`/modules/${moduleId}/bugs`, payload);
      setTitle('');
      setDescription('');
      setAssignees([]);
      await loadBugs();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create bug');
    }
  }

  function allowedTransitions(status) {
    const map = {
      open: ['solved'],
      solved: ['closed', 'reopened'],
      closed: ['reopened'],
      reopened: ['solved'],
    };
    return map[status] || [];
  }

  async function changeStatus(bug, to) {
    try {
      await apiPatch(`/bugs/${bug._id}/status`, { from: bug.status, to, note: '' });
      await loadBugs();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update status');
    }
  }

  const canClose = (bug) => (isAdmin || isTester) && bug.status === 'solved';

  return (
    <div className="space-y-6">
      <div className="text-2xl font-semibold">Project {project?.name || ''}</div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create bug (admin+tester) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="text-lg font-semibold mb-4">Create New Bug</div>
          {canCreate ? (
            <form className="space-y-3" onSubmit={createBug}>
              <select
                className="p-3 border rounded-lg"
                value={moduleId}
                onChange={e => setModuleId(e.target.value)}
              >
                <option value="">Select a module</option>
                {modules.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>

              <input
                className="p-3 border rounded-lg"
                placeholder="Bug title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea
                className="p-3 border rounded-lg"
                rows={4}
                placeholder="Bug description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Assign to</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {projectMembers.map(u => (
                    <label key={u._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={assignees.includes(String(u._id))}
                        onChange={(e) => {
                          const id = String(u._id);
                          setAssignees(s =>
                            e.target.checked ? [...s, id] : s.filter(x => x !== id)
                          );
                        }}
                      />
                      <span>{u.email} <em className="text-gray-400">({u.role})</em></span>
                    </label>
                  ))}
                </div>
              </div>
              <div><button className="px-5 py-3 rounded-lg bg-blue-600 text-white">Add Bug</button></div>
            </form>
          ) : (
            <div className="text-gray-500 text-sm">Only Admin/Tester can create bugs.</div>
          )}
        </div>

        {/* Bugs List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="font-semibold mb-3">Bugs</div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-2">Module</th>
                <th className="py-2">Bug Description</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map(b => {
                const mod = modules.find(m => String(m._id) === String(b.moduleId));
                const canSolve = (role === 'developer' && (b.assignees || []).includes(userId)) || isAdmin || isTester;
                const nexts = allowedTransitions(b.status);
                return (
                  <tr key={b._id} className="border-b">
                    <td className="py-3">{mod?.name || '—'}</td>
                    <td className="py-3">{b.title}</td>
                    <td className="py-3"><StatusPill status={b.status} /></td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {nexts.map(to => {
                          if (to === 'closed' && !canClose(b)) return null;
                          if (to !== 'closed' && !canSolve) return null;
                          return (
                            <button
                              key={to}
                              onClick={() => changeStatus(b, to)}
                              className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                            >
                              {to[0].toUpperCase() + to.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bugs.length === 0 && (
                <tr>
                  <td className="py-6 text-gray-400">No bugs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
