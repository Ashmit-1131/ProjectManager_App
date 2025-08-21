const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { userCreateSchema } = require('../validators');
const { AppError } = require('../utils/errors');

async function listUsers(req, res, next) {
  try {
    const { role, active, page = 1, limit = 20 } = req.query;
    const q = {};
    if (role) q.role = role;
    if (active !== undefined) q.isActive = active === 'true';
    const users = await User.find(q).skip((page - 1) * limit).limit(Number(limit)).select('-passwordHash');
    const total = await User.countDocuments(q);
    res.json({ data: users, total });
  } catch (e) { next(e); }
}

async function createUser(req, res, next) {
  try {
    const { error, value } = userCreateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const { email, password, role } = value;
    const exists = await User.findOne({ email });
    if (exists) throw new AppError(409, 'Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role });
    res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (e) { next(e); }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (e) { next(e); }
}

async function patchUser(req, res, next) {
  try {
    const updates = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    res.json(user);
  } catch (e) { next(e); }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new AppError(404, 'User not found');
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { listUsers, createUser, getUser, patchUser, deleteUser };
