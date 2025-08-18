import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';


const Layout = () => {
   const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'admin';
  
  function logout(){ 
    localStorage.removeItem('token');
     localStorage.removeItem('role'); navigate('/login');
     }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r">
        <div className="p-4 text-xl font-bold">Company Name</div>
        <nav className="p-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
          <Link to="/users" className="block px-3 py-2 rounded hover:bg-gray-100">User Management</Link>
          <Link to="/projects" className="block px-3 py-2 rounded hover:bg-gray-100">Projects</Link>
          <Link to="/modules" className="block px-3 py-2 rounded hover:bg-gray-100">Modules</Link>
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

export default Layout

