const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { loginSchema } = require('../validators');
const { AppError } = require('../utils/errors');
const { signToken } = require('../utils/jwt'); 


const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    const { email, password } = value;
    const normalizedEmail = (email || '').toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new AppError(401, 'Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError(401, 'Invalid credentials');


    const accessToken = signToken(user);

    res.json({ accessToken, role: user.role });
  } catch (e) {
    next(e);
  }
};

module.exports = { login };
