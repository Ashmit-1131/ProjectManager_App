const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { listUsers, createUser, getUser, patchUser, deleteUser } = require('../controllers/users.controller');

router.use(auth());
router.get('/', requireRole('admin'), listUsers);
router.post('/', requireRole('admin'), createUser);
router.get('/:id', requireRole('admin'), getUser);
router.patch('/:id', requireRole('admin'), patchUser);
router.delete('/:id', requireRole('admin'), deleteUser);

module.exports = router;
