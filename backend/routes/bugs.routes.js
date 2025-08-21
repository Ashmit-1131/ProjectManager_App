const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { listBugs, createBug, getBug, patchBug, deleteBug, changeStatus, listActivities } = require('../controllers/bugs.controller');

router.use(auth()); // all bug routes require auth

// listing
router.get('/projects/:projectId/bugs', requireRole('tester', 'developer', 'admin'), listBugs);
router.get('/modules/:moduleId/bugs', requireRole('tester', 'developer', 'admin'), listBugs);

// create only via module (tester or admin)
router.post('/modules/:moduleId/bugs', requireRole('tester', 'admin'), createBug);

// single bug ops
router.get('/bugs/:id', requireRole('tester', 'developer', 'admin'), getBug);
router.patch('/bugs/:id', requireRole('tester', 'developer', 'admin'), patchBug);
router.delete('/bugs/:id', requireRole('tester', 'developer', 'admin'), deleteBug);
router.patch('/bugs/:id/status', requireRole('tester', 'developer', 'admin'), changeStatus);
router.get('/bugs/:id/activities', requireRole('tester', 'developer', 'admin'), listActivities);

module.exports = router;
