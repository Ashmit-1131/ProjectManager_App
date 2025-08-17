const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { register, login } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/register', auth(), requireRole('admin'), register);

module.exports = router;
