

const jwt = require('jsonwebtoken');
const User = require('../models/User');


function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}


function auth(required = true) {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);

      if (!token) {
        if (required) return res.status(401).json({ message: 'Missing token' });
        req.user = null;
        return next();
      }


      const payload = jwt.verify(token, process.env.JWT_SECRET);


      const user = await User.findById(payload.sub);
      if (!user || user.isActive === false) {
        return res.status(401).json({ message: 'Invalid user' });
      }

   
      req.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email
      };

      next();
    } catch (err) {
     
      return res.status(401).json({ message: 'Invalid/expired token' });
    }
  };
}

module.exports = { auth, extractToken };
