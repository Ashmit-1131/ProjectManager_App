import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../api';

const StatusPill = ({ status }) => {
  const label =
    status === 'Completed' ? 'Completed' :
    status ? status[0].toUpperCase() + status.slice(1) : '—';

  const classes =
    status === 'open' ? 'bg-red-50 text-red-700' :
    status === 'solved' ? 'bg-blue-50 text-blue-700' :
    status === 'closed' ? 'bg-gray-100 text-gray-700' :
    'bg-green-50 text-green-700';

  return <span className={`px-3 py-1 text-xs rounded-full ${classes}`}>{label}</span>;
};

export default function ProjectHub() {
  const role = localStorage.getItem('role') || 'admin';
  const canClose = role === 'admin' || role === 'tester';

  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState('');
  const [modulesByProject, setModulesByProject] = useState({});
  const [bugsByProject, setBugsByProject] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(''); // module id currently performing action

  async function loadProjects() {
    const path = role === 'admin' ? '/projects' : '/projects/my-projects';
    const res = await apiGet(path).catch(() => ({ data: [] }));
    const list = res.data || res || [];
    setProjects(Array.isArray(list) ? list : []);
    if (Array.isArray(list) && list.length && !active) setActive(list[0]._id);
  }

  async function loadProjectData(pid) {
    if (!pid) return;
    const [modsRes, bugsRes] = await Promise.all([
      apiGet(`/projects/${pid}/modules`).catch(() => ({ data: [] })),
      apiGet(`/projects/${pid}/bugs`).catch(() => ({ data: [] }))
    ]);

    const mods = modsRes.data || modsRes || [];
    const bugs = bugsRes.data || bugsRes || [];

    setModulesByProject(s => ({ ...s, [pid]: Array.isArray(mods) ? mods : [] }));
    setBugsByProject(s => ({ ...s, [pid]: Array.isArray(bugs) ? bugs : [] }));
  }

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (active) loadProjectData(active); }, [active]);

  // Action: either close a solved bug, or mark an open bug as solved.
  async function handleActionForModule(m) {
    if (!active) return;
    const moduleBugs = (bugsByProject[active] || []).filter(b => String(b.moduleId) === String(m._id));
    const solvedBug = moduleBugs.find(b => b.status === 'solved');
    const openBug = moduleBugs.find(b => b.status === 'open');

    // decide action: prefer closing solved bug; otherwise mark open as solved
    let target = null;
    let from = '';
    let to = '';

    if (solvedBug) {
      target = solvedBug;
      from = 'solved';
      to = 'closed';
    } else if (openBug) {
      target = openBug;
      from = 'open';
      to = 'solved';
    } else {
      // nothing to do
      return;
    }

    setActionLoadingId(m._id);
    try {
      await apiPatch(`/bugs/${target._id}/status`, { from, to, note: '' });
      await loadProjectData(active);
    } catch (err) {
      // show a helpful error
      const msg = (err && err.message) || 'Failed to update bug status';
      alert(msg);
      console.error('Action error', err);
    } finally {
      setActionLoadingId('');
    }
  }

  const modules = modulesByProject[active] || [];
  const bugs = bugsByProject[active] || [];

  return (
    <div className="min-h-screen flex bg-gray-50 p-8">
      {/* Sidebar */}
      <aside className="w-64 mr-8">
        <div className="h-full bg-slate-800 text-white rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center text-xl">⊞</div>
            <div className="text-lg font-semibold">ProjectHub</div>
          </div>

          <div className="text-sm text-slate-300 mb-3">Projects</div>
          <div className="flex-1 overflow-auto">
            {projects.map(p => (
              <button
                key={p._id}
                onClick={() => setActive(p._id)}
                className={`w-full text-left flex items-center justify-between px-4 py-3 mb-2 rounded-lg
                  ${active === p._id ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-white/5'}`}
              >
                <span>{p.name}</span>
                <span className={`ml-2 ${active === p._id ? 'text-white/70' : 'text-slate-400'}`}>›</span>
              </button>
            ))}
            {projects.length === 0 && <div className="px-4 py-6 text-slate-400">No projects</div>}
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <section className="flex-1">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-2xl font-semibold mb-6">
            {projects.find(p => p._id === active)?.name || 'Select Project'}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-3 px-4 rounded-tl-lg bg-gray-50 border border-gray-100">Module</th>
                  <th className="py-3 px-4 bg-gray-50 border border-gray-100">Description</th>
                  <th className="py-3 px-4 bg-gray-50 border border-gray-100">Status</th>
                  <th className="py-3 px-4 rounded-tr-lg bg-gray-50 border border-gray-100">Action</th>
                </tr>
              </thead>

              <tbody>
                {modules.map(m => {
                  const moduleBugs = bugs.filter(b => String(b.moduleId) === String(m._id));
                  const nonClosed = moduleBugs.find(b => b.status !== 'closed');
                  const status = nonClosed ? nonClosed.status : 'Completed';
                  const desc = m.description || moduleBugs[0]?.description || '—';

                  const hasOpenBug = moduleBugs.some(b => b.status === 'open');
                  const hasSolvedBug = moduleBugs.some(b => b.status === 'solved');

                  // determine action label: Close if there's a solved bug, otherwise Mark Solved (if open)
                  const actionLabel = hasSolvedBug ? 'Close' : (hasOpenBug ? 'Mark Solved' : null);
                  const showAction = canClose && !!actionLabel;

                  return (
                    <tr key={m._id} className="border-b last:border-b-0">
                      <td className="py-5 px-4 align-top font-medium">{m.name}</td>
                      <td className="py-5 px-4 align-top text-gray-600">{desc}</td>
                      <td className="py-5 px-4 align-top">
                        <StatusPill status={status} />
                      </td>
                      <td className="py-5 px-4 align-top">
                        {showAction ? (
                          <button
                            onClick={() => handleActionForModule(m)}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
                            disabled={actionLoadingId === m._id}
                          >
                            {actionLoadingId === m._id ? 'Working...' : actionLabel}
                          </button>
                        ) : (
                          <div className="text-gray-400 text-sm">—</div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {modules.length === 0 && (
                  <tr>
                    <td className="py-6 px-4 text-gray-400" colSpan={4}>No modules</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
