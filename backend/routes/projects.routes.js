const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { listProjects, createProject, getProject, patchProject, deleteProject, patchMembers } = require('../controllers/projects.controller');

router.use(auth());
router.get('/', requireRole('admin'), listProjects);
router.post('/', requireRole('admin'), createProject);
router.get('/:id', requireRole('admin'), getProject);
router.patch('/:id', requireRole('admin'), patchProject);
router.delete('/:id', requireRole('admin'), deleteProject);
router.patch('/:id/members', requireRole('admin'), patchMembers);

module.exports = router;
