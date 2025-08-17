const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../validators');
const { AppError } = require('../utils/errors');

function sign(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' });
}

// Admin-only register
async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const { email, password, role } = value;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError(409, 'Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role });
    res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const { email, password } = value;
    const user = await User.findOne({ email });
    if (!user) throw new AppError(401, 'Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError(401, 'Invalid credentials');
    const accessToken = sign(user);
    res.json({ accessToken, role: user.role });
  } catch (e) { next(e); }
}

module.exports = { register, login };
