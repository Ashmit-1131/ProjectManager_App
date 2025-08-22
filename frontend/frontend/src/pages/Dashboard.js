
import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';

function StatCard({ icon, title, value, iconBg='bg-gray-100' }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-3">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const role = localStorage.getItem('role') || 'user';
  const userId = localStorage.getItem('userId') || '';
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [openBugs, setOpenBugs] = useState(0);
  const [closedBugs, setClosedBugs] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // projects (admin = all, others = mine)
        const projectsPath = role === 'admin' ? '/projects' : '/projects/my-projects';
        const projRes = await apiGet(projectsPath);
        const projects = projRes.data || projRes || [];
        const pList = Array.isArray(projects) ? projects : [];
        setTotalProjects(pList.length);

        // users (admin only)
        if (role === 'admin') {
          const usersRes = await apiGet('/users');
          const users = usersRes.data || usersRes || [];
          setTotalUsers(Array.isArray(users) ? users.length : 0);
        }

        // bugs aggregation (flatten all project bugs)
        const lists = await Promise.all(
          pList.map(p => apiGet(`/projects/${p._id}/bugs`).catch(() => ({ data: [] })))
        );
        const allBugs = lists.flatMap(r => (Array.isArray(r) ? r : r.data || []));
        if (role === 'admin') {
          setOpenBugs(allBugs.filter(b => b.status === 'open').length);
          setClosedBugs(allBugs.filter(b => b.status === 'closed').length);
        } else {
          // For tester/dev: “for them” = createdBy or assignee
          const mine = allBugs.filter(b => String(b.reportedBy) === userId ||
                                           (Array.isArray(b.assignees) && b.assignees.includes(userId)));
          setOpenBugs(mine.filter(b => b.status === 'open').length);
          setClosedBugs(mine.filter(b => b.status === 'closed').length);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [role, userId]);

  const IconUsers = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 118 0 4 4 0 01-8 0z" />
    </svg>
  );
  const IconFolder = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6H3z" />
    </svg>
  );
  const IconBug = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 13h16M4 9h16M10 21V3m4 18V3" />
    </svg>
  );

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Welcome to the Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {role === 'admin' && (
          <StatCard icon={IconUsers} iconBg="bg-blue-50" title="Total Users" value={loading ? '—' : totalUsers} />
        )}
        <StatCard icon={IconFolder} iconBg="bg-green-50" title="Projects" value={loading ? '—' : totalProjects} />
        <StatCard icon={IconBug} iconBg="bg-green-50" title="Opened Bugs" value={loading ? '—' : openBugs} />
        <StatCard icon={IconBug} iconBg="bg-purple-50" title="Closed Bugs" value={loading ? '—' : closedBugs} />
      </div>
    </div>
  );
}
