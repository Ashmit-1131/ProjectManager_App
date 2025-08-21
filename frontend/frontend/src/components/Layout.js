import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { apiGet } from '../api';

export default function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'admin';
  const [projects, setProjects] = useState([]);
  const loc = useLocation();

  async function loadProjects() {
    try {
      // Admin can see all projects, others only their assigned projects
      const path = role === 'admin' ? '/projects' : '/projects/my-projects';
      const res = await apiGet(path);
      const list = res.data || res;
      setProjects(list || []);
    } catch (e) {
      // if forbidden or other error, clear projects and log
      console.error('Failed to load projects', e);
      setProjects([]);
    }
  }

  useEffect(() => {
    loadProjects();
    // reload when role changes in localStorage (rare)
    const onStorage = () => loadProjects();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r">
        <div className="p-4 text-xl font-bold">Dashboard</div>
        <nav className="p-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
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
            {projects.length === 0 && <div className="text-xs text-gray-400 px-3">No projects</div>}
          </div>
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <div className="text-lg font-semibold">Dashboard Overview</div>
          <div>
            <span className="mr-4">Role: {role}</span>
            <button onClick={logout} className="px-3 py-1 bg-blue-600 text-white rounded">Logout</button>
          </div>
        </header>

        <div className="p-6 container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
