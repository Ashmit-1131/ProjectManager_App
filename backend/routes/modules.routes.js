const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  listModules,
  createModule,
  listMyModules
} = require('../controllers/modules.controller');

router.use(auth());

// list modules for a project (tester/dev/admin can request — controller enforces membership)
router.get('/projects/:projectId/modules', requireRole('tester', 'developer', 'admin'), listModules);

// create module: tester or admin
router.post('/projects/:projectId/modules', requireRole('tester', 'admin'), createModule);

// convenience: list modules across all projects assigned to current user
// (tester/developer/admin). Useful for dashboards.
router.get('/modules/my-modules', requireRole('tester', 'developer', 'admin'), listMyModules);

module.exports = router;
