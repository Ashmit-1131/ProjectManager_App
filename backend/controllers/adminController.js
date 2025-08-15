const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { registerSchema } = require('../validators'); 
const { AppError } = require('../utils/errors');     

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');


const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    const {name, email, password, role } = value;

 
    const normalizedEmail = (email || '').toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) throw new AppError(409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);


    const user = await User.create({name, email: normalizedEmail, passwordHash, role });

    res.status(201).json({ id: user._id,name:user.name, email: user.email, role: user.role });
  } catch (e) {
    next(e);
  }
};

module.exports = { register };
