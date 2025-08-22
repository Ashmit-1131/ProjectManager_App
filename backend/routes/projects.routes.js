const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  listProjects,
  createProject,
  getProject,
  patchProject,
  deleteProject,
  patchMembers,
  getAssignedProjects
} = require('../controllers/projects.controller');

router.use(auth());

// My projects (tester/developer/admin) - must be above admin-only listing
router.get('/my-projects', requireRole('tester', 'developer', 'admin'), getAssignedProjects);

// Admin-only endpoints
router.get('/', requireRole('admin'), listProjects);
router.post('/', requireRole('admin'), createProject);
// allow tester, developer, admin to hit this route; controller enforces membership
router.get('/:id', requireRole('tester','developer','admin'), getProject);

router.patch('/:id', requireRole('admin'), patchProject);
router.delete('/:id', requireRole('admin'), deleteProject);
router.patch('/:id/members', requireRole('admin'), patchMembers);

module.exports = router;
