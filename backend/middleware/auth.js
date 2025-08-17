const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth=(required = true)=> {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        if (required) return res.status(401).json({ message: 'Missing token' });
        req.user = null; return next();
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid user' });
      req.user = { id: user._id.toString(), role: user.role, email: user.email };
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Invalid/expired token' });
    }
  };
}

const requireRole=(...roles)=> {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { auth, requireRole };
