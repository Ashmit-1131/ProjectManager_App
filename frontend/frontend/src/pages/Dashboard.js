import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';

const Dashboard = () => {
  const [usersCount, setUsersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [openBugs, setOpenBugs] = useState(0);

  useEffect(()=>{ load(); }, []);
  async function load(){
    try {
      const u = await apiGet('/users');
       setUsersCount((u.data||u).length || (u.length||0));
      const p = await apiGet('/projects'); 
      setProjectsCount((p.data||p).length || (p.length||0));
      const projects = (p.data||p) || [];
      let totalOpen = 0;
      for (const proj of projects) {
        try {
          const b = await apiGet('/projects/' + proj._id + '/bugs');
          const list = b.data || b;
          totalOpen += (list.filter ? list.filter(x=>x.status==='open').length : 0);
        } catch (_) {}
      }
      setOpenBugs(totalOpen);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Welcome to the Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">{usersCount}</div>
        </div>

        <div className="p-6 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Projects</div>
          <div className="text-2xl font-bold">{projectsCount}</div>
        </div>

        <div className="p-6 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Open Bugs</div>
          <div className="text-2xl font-bold">{openBugs}</div>
        </div>
        
      </div>
    </div>
  )
}

export default Dashboard



