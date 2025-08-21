import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import ProjectsPage from './pages/ProjectsPage';
import ModulesPage from './pages/ModulesPage';
import Layout from './components/Layout';
import ProjectTracker from './pages/ProjectTracker';
import ProjectHub from './pages/ProjectHub';

function Private({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Admin-only route wrapper
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin-only routes */}
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="projects" element={<AdminRoute><ProjectsPage /></AdminRoute>} />

        {/* Project tracker and modules (accessible to authenticated users) */}
        <Route path="projects/:id/tracker" element={<ProjectTracker />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="projecthub" element={<ProjectHub />} />
      </Route>

      <Route path="*" element={<div className="p-8">Not Found</div>} />
    </Routes>
  );
}
