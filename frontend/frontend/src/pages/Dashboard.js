import React, { useEffect, useState } from 'react';
import { apiGet } from '../api';

/**
 * Dashboard
 *
 * - Admin: shows Total Users, Opened Bugs, Closed Bugs
 * - Tester/Developer (non-admin): shows Created Bugs and Assigned Bugs
 *
 * Assumptions:
 * - localStorage.role contains role string (e.g. "admin" | "tester" | "developer")
 * - localStorage.userId contains the logged-in user's id (for filtering created/assigned bugs)
 * - apiGet returns either an array or an object with `.data` being an array
 * - project bug endpoint: /projects/:id/bugs
 *
 * The code is defensive and tolerant of slight schema differences (createdBy / reporter / assignee / assignedTo).
 */

function StatCard({ icon, iconBg = 'bg-gray-100', title, value }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-transparent">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${iconBg} inline-flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-3">{value}</div>
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  // meaningful state names
  const [role, setRole] = useState('user');
  const [userId, setUserId] = useState(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);

  // admin-specific
  const [totalOpenBugs, setTotalOpenBugs] = useState(0);
  const [totalClosedBugs, setTotalClosedBugs] = useState(0);

  // non-admin
  const [createdBugsCount, setCreatedBugsCount] = useState(0);
  const [assignedBugsCount, setAssignedBugsCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const storedRole = localStorage.getItem('role') || 'user';
      const storedUserId = localStorage.getItem('userId') || null;
      setRole(storedRole);
      setUserId(storedUserId);

      // --- users count (only for admin) ---
      if (storedRole === 'admin') {
        try {
          const usersResp = await apiGet('/users');
          const usersList = Array.isArray(usersResp) ? usersResp : usersResp?.data ?? [];
          setTotalUsers(usersList.length || 0);
        } catch (err) {
          console.warn('Failed to load users:', err);
          setTotalUsers(0);
        }
      }

      // --- projects accessible to this user ---
      const projectsPath = storedRole === 'admin' ? '/projects' : '/projects/my-projects';
      let projects = [];
      try {
        const projectsResp = await apiGet(projectsPath);
        projects = Array.isArray(projectsResp) ? projectsResp : projectsResp?.data ?? [];
        setTotalProjects(projects.length || 0);
      } catch (err) {
        console.warn('Failed to load projects:', err);
        projects = [];
        setTotalProjects(0);
      }

      // --- fetch bugs for all accessible projects in parallel ---
      const bugFetchPromises = projects.map((proj) =>
        apiGet(`/projects/${proj._id}/bugs`).then(
          (res) => (Array.isArray(res) ? res : res?.data ?? []),
          (err) => {
            console.warn(`Failed to load bugs for project ${proj._id}:`, err);
            return []; // ignore per-project errors
          }
        )
      );

      const bugsLists = await Promise.all(bugFetchPromises);
      // flatten
      const allBugs = bugsLists.flat();

      // --- admin aggregates ---
      if (storedRole === 'admin') {
        const openCount = allBugs.filter((b) => (b?.status || '').toString().toLowerCase() === 'open').length;
        const closedCount = allBugs.filter((b) => (b?.status || '').toString().toLowerCase() === 'closed').length;
        setTotalOpenBugs(openCount);
        setTotalClosedBugs(closedCount);
      } else {
        // --- non-admin aggregates: created vs assigned to the current user ---
        const uid = storedUserId;
        if (!uid) {
          setCreatedBugsCount(0);
          setAssignedBugsCount(0);
        } else {
          const createdCount = allBugs.filter((b) => {
            // handle multiple possible reporter/creator fields
            return (
              b?.createdBy === uid ||
              b?.createdById === uid ||
              b?.reporter === uid ||
              b?.reporterId === uid ||
              b?.author === uid
            );
          }).length;

          const assignedCount = allBugs.filter((b) => {
            return (
              b?.assignee === uid ||
              b?.assigneeId === uid ||
              b?.assignedTo === uid ||
              b?.assigned === uid
            );
          }).length;

          setCreatedBugsCount(createdCount);
          setAssignedBugsCount(assignedCount);
        }
      }
    } catch (e) {
      console.error('Unexpected dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }

  // small inline SVG icons to avoid adding deps
  const UserIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 118 0 4 4 0 01-8 0z" />
    </svg>
  );
  const FolderIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6H3z" />
    </svg>
  );
  const BugIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V7a2 2 0 00-2-2h-3.586a1 1 0 00-.707.293l-1.414 1.414A2 2 0 0110.414 8H7a2 2 0 00-2 2v1" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13v6h14v-6" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to the Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin: Total Users */}
          {role === 'admin' && (
            <StatCard
              icon={UserIcon}
              iconBg="bg-blue-50"
              title="Total Users"
              value={loading ? '—' : totalUsers}
            />
          )}

          {/* Projects card (always visible) */}
          <StatCard icon={FolderIcon} iconBg="bg-green-50" title="Projects" value={loading ? '—' : totalProjects} />

          {/* Admin: Open / Closed Bugs; Non-admin: Created / Assigned Bugs */}
          {role === 'admin' ? (
            <>
              <StatCard icon={BugIcon} iconBg="bg-green-50" title="Opened Bugs" value={loading ? '—' : totalOpenBugs} />
              <StatCard icon={BugIcon} iconBg="bg-purple-50" title="Closed Bugs" value={loading ? '—' : totalClosedBugs} />
            </>
          ) : (
            <>
              <StatCard icon={BugIcon} iconBg="bg-purple-50" title="Created Bugs" value={loading ? '—' : createdBugsCount} />
              <StatCard icon={BugIcon} iconBg="bg-green-50" title="Assigned Bugs" value={loading ? '—' : assignedBugsCount} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
