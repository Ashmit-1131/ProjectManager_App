const router = require('express').Router();
const { auth} = require('../middlewares/auth');
const { register } = require('../controllers/adminController');
const {requireRole}=require('../middlewares/isAdmin')


router.post('/register', auth(), requireRole('admin'), register);

module.exports = router;
