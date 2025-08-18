import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../api';

const ProjectsPage=()=>{
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [name,setName]=useState(''); 
  const [desc,setDesc]=useState(''); 
  const [members,setMembers]=useState('');

  useEffect(()=>{ load(); }, []);
  async function load(){
    const p = await apiGet('/projects'); setProjects(p.data || p);
    const u = await apiGet('/users'); setUsers(u.data || u);
  }
  async function create(e){
    e.preventDefault();
    const mem = members.split(',').map(s=>s.trim()).filter(Boolean);
    await apiPost('/projects', { name, description: desc, members: mem });
    setName(''); setDesc(''); setMembers('');
    load();
  }
  async function openAssign(id){
    const ids = prompt('Comma separated user ids to add:');
    if (!ids) return;
    const add = ids.split(',').map(s=>s.trim()).filter(Boolean);
    await apiPatch('/projects/' + id + '/members', { add, remove: [] });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl mb-4">Projects</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <form className="grid grid-cols-1 gap-3" onSubmit={create}>
          <input className="p-2 border rounded" placeholder="Project name" value={name} onChange={e=>setName(e.target.value)} />
          <textarea className="p-2 border rounded" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
          <input className="p-2 border rounded" placeholder="member ids comma separated" value={members} onChange={e=>setMembers(e.target.value)} />
          <div className="text-right"><button className="px-4 py-2 bg-blue-600 text-white rounded">Add Project</button></div>
        </form>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="mb-3 font-semibold">Project List</h3>
        <table className="w-full">
          <thead><tr className="text-left border-b"><th>Project Name</th><th>Description</th><th>Members</th><th>Actions</th></tr></thead>
          <tbody>
            {projects.map(p => <tr key={p._id} className="hover:bg-gray-50">
              <td className="py-2">{p.name}</td>
              <td>{p.description}</td>
              <td>{(p.members||[]).map(m=>m.email || m).join(', ')}</td>
              <td><button className="text-blue-600 mr-3" onClick={()=>openAssign(p._id)}>Assign</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProjectsPage