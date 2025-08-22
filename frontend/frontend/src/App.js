// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import ProjectsPage from './pages/ProjectsPage';
import ModulesPage from './pages/ModulesPage';
import BugTracker from './pages/BugTracker';
import ProjectHub from './pages/ProjectHub';
import Layout from './components/Layout';

function Private({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function TesterRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'tester') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin-only */}
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="projects" element={<AdminRoute><ProjectsPage /></AdminRoute>} />

        {/* Shared */}
        <Route path="modules" element={<ModulesPage />} />
        <Route path="projects/:id/tracker" element={<BugTracker />} />
        <Route path="projecthub" element={<ProjectHub />} />
      </Route>

      <Route path="*" element={<div className="p-8">Not Found</div>} />
    </Routes>
  );
}
