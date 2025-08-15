// utils/jwt.js
// Small helper to create JWT access tokens. Keeps token logic in one place.

const jwt = require('jsonwebtoken');

/**
 * signToken - creates a JWT for the given user-like object.
 * We put user id in 'sub' (JWT subject) and include role for convenience.
 *
 * @param {{ _id: any, role: string }|{ id: string, role: string }} user
 * @returns {string} signed JWT
 */
function signToken(user) {
  const subject = user._id ? user._id.toString() : user.id;
  const payload = { sub: subject, role: user.role };

  // ACCESS_TOKEN_TTL env fallback to 15 minutes if not provided.
  const expiresIn = process.env.ACCESS_TOKEN_TTL || '15m';

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

module.exports = { signToken };
