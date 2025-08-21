import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';

export default function ProjectHub() {
    const [projects, setProjects] = useState([]);
    const [modules, setModules] = useState([]);

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const p = await apiGet('/projects');
            setProjects(p.data || p);
            const m = JSON.parse(localStorage.getItem('modules') || '[]');
            setModules(m);
        } catch (e) { 
            console.error(e);
         }
    }

    function toggleStatus(id) {
        const next = modules.map(m => m.id === id ? { ...m, status: m.status === 'Open' ? 'Closed' : 'Open' } : m);
        setModules(next);
        localStorage.setItem('modules', JSON.stringify(next));
    }

    return (
        <div>
            <h2 className="text-2xl mb-4">Project Hub</h2>

            <div className="bg-white p-4 rounded shadow">
                <h3 className="mb-3 font-semibold">Modules</h3>
                <table className="w-full">
                    <thead><tr className="text-left border-b"><th>Project</th><th>Module</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {modules.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="py-2">{(projects.find(p => p._id === m.projectId) || {}).name || '—'}</td>
                                <td>{m.name}</td>
                                <td><span className={`px-2 py-1 rounded-full text-sm ${m.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{m.status}</span></td>
                                <td><button onClick={() => toggleStatus(m.id)} className="px-3 py-1 bg-red-600 text-white rounded">Toggle</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {modules.length === 0 && <div className="text-sm text-gray-500 mt-4">No modules yet — add some on Modules page.</div>}
            </div>
        </div>
    );
}
