
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { apiGet, meProjectsPath } from '../api';

export default function Layout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const role = localStorage.getItem('role') || 'admin';
  const [projects, setProjects] = useState([]);

  async function loadProjects() {
    try {
      const res = await apiGet(meProjectsPath());
      const list = res.data || res;
      setProjects(Array.isArray(list) ? list : []);
    } catch {
      setProjects([]);
    }
  }

  useEffect(() => { loadProjects(); }, []);

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      <aside className="w-64 bg-white border-r">
        <div className="p-5 text-xl font-bold">Dashboard</div>
        <nav className="px-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard Overview</Link>

          {role === 'admin' && (
            <>
              <Link to="/users" className="block px-3 py-2 rounded hover:bg-gray-100">User Management</Link>
              <Link to="/projects" className="block px-3 py-2 rounded hover:bg-gray-100">Projects</Link>
            </>
          )}

          <Link to="/modules" className="block px-3 py-2 rounded hover:bg-gray-100">Modules</Link>
          <Link to="/projecthub" className="block px-3 py-2 rounded hover:bg-gray-100">Project Hub</Link>

          <div className="mt-6 text-xs text-gray-500 px-3">Projects</div>
          <div className="space-y-1 mt-2 px-2">
            {projects.map(p => {
              const to = '/projects/' + p._id + '/tracker';
              const active = loc.pathname === to;
              return (
                <Link key={p._id} to={to}
                  className={`block px-3 py-2 rounded ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                  {p.name}
                </Link>
              );
            })}
            {projects.length === 0 && (
              <div className="text-xs text-gray-400 px-3">No projects</div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <div className="text-lg font-semibold">Dashboard Overview</div>
          <div>
            <span className="mr-4">Role: {role}</span>
            <button onClick={logout} className="px-3 py-1 bg-blue-600 text-white rounded">
              Logout
            </button>
          </div>
        </header>
        <div className="p-6 container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
