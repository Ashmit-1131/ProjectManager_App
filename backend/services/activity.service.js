// backend/services/activity.service.js
const Activity = require('../models/Activity');

/**
 * Log an activity. This function swallows DB errors (best-effort).
 * payload fields:
 *  - bugId
 *  - moduleId
 *  - actorId
 *  - action (string)
 *  - from (optional)
 *  - to (optional)
 *  - note (optional)
 */
async function logActivity(payload) {
  try {
    // Normalize minimal payload shape
    const doc = {
      bugId: payload.bugId,
      moduleId: payload.moduleId,
      actorId: payload.actorId,
      action: payload.action,
    };
    if (payload.from !== undefined) doc.from = payload.from;
    if (payload.to !== undefined) doc.to = payload.to;
    if (payload.note !== undefined) doc.note = payload.note;

    await Activity.create(doc);
  } catch (err) {
    // best effort: don't block main flow if activity logging fails
    // optionally log error to console for debugging
    console.error('logActivity error:', err && err.message ? err.message : err);
  }
}

module.exports = { logActivity };
