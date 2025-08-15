

const { AppError } = (() => {
  try { return require('../utils/errors'); } catch (e) { return {}; }
})();


function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}


function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = { adminOnly, requireRole };
