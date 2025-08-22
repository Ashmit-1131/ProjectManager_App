
import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ProjectHubSidebar() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeFromUrl = searchParams.get('active');

  async function loadProjects() {
    const res = await apiGet('/projects').catch(() => ({ data: [] }));
    const list = res.data || res || [];
    setProjects(Array.isArray(list) ? list : []);
  }

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    // if URL contains ?active=... and it exists in list, keep it — no-op here, ProjectHub page will read query param
  }, [activeFromUrl]);

  return (
    <aside className="w-72 min-h-screen p-6 bg-slate-900 text-white rounded-r-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center text-white/90">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5"></rect>
            <path d="M8 3v18" strokeWidth="1.5" strokeLinecap="round"></path>
          </svg>
        </div>

        <div>
          <div className="text-lg font-semibold">ProjectHub</div>
        </div>
      </div>

      <div className="text-slate-400 mb-4">Projects</div>

      <div className="space-y-3">
        {projects.length === 0 && (
          <div className="px-4 py-6 rounded-lg bg-slate-800/30 text-center text-slate-400">
            No projects
          </div>
        )}

        {projects.map(p => (
          <button
            key={p._id}
            onClick={() => navigate(`/projecthub?active=${p._id}`)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
          >
            <span className="text-left text-white">{p.name}</span>
            <span className="text-white/70">›</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex-1" />
    </aside>
  );
}
