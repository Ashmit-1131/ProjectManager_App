const Bug = require('../models/Bug');
const Project = require('../models/Project');
const Module = require('../models/Module');
const Activity = require('../models/Activity');
const { bugCreateSchema, bugUpdateSchema, statusSchema } = require('../validators');
const { AppError } = require('../utils/errors');
const { logActivity } = require('../services/activity.service');

const allowedTransitions = new Map([
  ['open', ['solved']],
  ['solved', ['closed', 'reopened']],
  ['closed', ['reopened']],
  ['reopened', ['solved']]
]);

function canUpdateStatus(user, bug, to) {
  if (user.role === 'admin') return true;
  const uid = user.id;
  const isAssignee = bug.assignees.map(String).includes(uid);
  const isReporter = String(bug.reportedBy) === uid;
  if (!isAssignee && !isReporter) return false;
  if (to === 'closed' && !(user.role === 'tester')) return false; // only tester/admin can close
  return true;
}

/**
 * Helper: ensure current user can view data for the given projectId.
 * Admin bypass. Otherwise user must be in project.members.
 */
async function ensureProjectAccessOrThrow(user, projectId) {
  if (user.role === 'admin') return;
  const project = await Project.findById(projectId).select('members');
  if (!project) throw new AppError(404, 'Project not found');
  const isMember = project.members.map(String).includes(String(user.id));
  if (!isMember) throw new AppError(403, 'You are not assigned to this project');
}

/**
 * listBugs supports:
 * - GET /projects/:projectId/bugs   -> list by project
 * - GET /modules/:moduleId/bugs     -> list by module
 */
async function listBugs(req, res, next) {
  try {
    const { projectId, moduleId } = req.params;
    const { status, assignee, page = 1, limit = 20 } = req.query;

    // determine projectId for access check
    let projectIdForCheck = projectId;
    if (!projectIdForCheck && moduleId) {
      const mod = await Module.findById(moduleId).select('projectId');
      if (!mod) throw new AppError(404, 'Module not found');
      projectIdForCheck = String(mod.projectId);
    }
    if (!projectIdForCheck) throw new AppError(400, 'projectId or moduleId is required');

    // enforce access (admin bypass)
    await ensureProjectAccessOrThrow(req.user, projectIdForCheck);

    const q = {};
    if (projectId) q.projectId = projectId;
    if (moduleId) q.moduleId = moduleId;
    if (status) q.status = status;
    if (assignee) q.assignees = assignee;

    const data = await Bug.find(q).skip((page - 1) * limit).limit(Number(limit));
    const total = await Bug.countDocuments(q);
    res.json({ data, total });
  } catch (e) { next(e); }
}

/**
 * createBug:
 * - POST /modules/:moduleId/bugs
 * Rules:
 * - admin: allowed for any module/project
 * - tester: must be project member
 * - only tester or admin may create
 */
async function createBug(req, res, next) {
  try {
    const { error, value } = bugCreateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    const moduleId = req.params.moduleId || value.moduleId;
    if (!moduleId) throw new AppError(400, 'moduleId is required (either in URL or body)');

    const mod = await Module.findById(moduleId);
    if (!mod) throw new AppError(404, 'Module not found');

    const projectId = String(mod.projectId);
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found for module');

    // assignees must be subset of project members
    const assignees = value.assignees || [];
    if (assignees.length) {
      const memberIds = project.members.map(String);
      const bad = assignees.filter(a => !memberIds.includes(String(a)));
      if (bad.length) throw new AppError(400, 'Assignees must be project members');
    }

    // only tester or admin allowed to create
    if (!['tester', 'admin'].includes(req.user.role)) {
      throw new AppError(403, 'Only tester or admin can create bugs');
    }

    // tester must be project member; admin bypass
    if (req.user.role !== 'admin') {
      const isMember = project.members.map(String).includes(String(req.user.id));
      if (!isMember) throw new AppError(403, 'You are not assigned to this project');
    }

    const reporterId = req.user.id;
    const bug = await Bug.create({
      projectId,
      moduleId,
      title: value.title,
      description: value.description || '',
      reportedBy: reporterId,
      assignees
    });

    await logActivity({
      bugId: bug._id,
      moduleId: bug.moduleId,
      actorId: reporterId,
      action: 'create',
      to: bug.toObject()
    });

    res.status(201).json(bug);
  } catch (e) { next(e); }
}

/**
 * GET single bug — ensure only project members (or admin) can fetch
 */
async function getBug(req, res, next) {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');

    await ensureProjectAccessOrThrow(req.user, bug.projectId);
    res.json(bug);
  } catch (e) { next(e); }
}

/**
 * PATCH bug
 * - title/description/moduleId updates: allowed for reporter/assignee/admin (unchanged)
 * - assignees update: allowed for reporter/assignee/admin OR tester who is project member
 */
async function patchBug(req, res, next) {
  try {
    const { error, value } = bugUpdateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');

    // ensure user has view access first
    await ensureProjectAccessOrThrow(req.user, bug.projectId);

    const uid = req.user.id;
    const isAssignee = bug.assignees.map(String).includes(uid);
    const isReporter = String(bug.reportedBy) === uid;
    const isAdmin = req.user.role === 'admin';

    // For non-assignee/reporter/admin, they may still update assignees IF they are a tester & project member.
    const isTesterAndMember = (req.user.role === 'tester') && (await Project.exists({ _id: bug.projectId, members: uid }));

    // if they are not allowed to modify general fields, forbid unless they are reporter/assignee/admin
    const canModifyGeneral = isAssignee || isReporter || isAdmin;
    if (!canModifyGeneral) {
      // they may still be allowed to change assignees only (handled below)
      if (!value.assignees) {
        throw new AppError(403, 'Forbidden');
      }
    }

    const before = { ...bug.toObject() };

    // general updates (title/description/moduleId) require canModifyGeneral
    if (value.title) {
      if (!canModifyGeneral) throw new AppError(403, 'Forbidden to change title');
      bug.title = value.title;
    }
    if (value.description !== undefined) {
      if (!canModifyGeneral) throw new AppError(403, 'Forbidden to change description');
      bug.description = value.description;
    }
    if (value.moduleId) {
      if (!canModifyGeneral) throw new AppError(403, 'Forbidden to change module');
      const mod = await Module.findById(value.moduleId);
      if (!mod) throw new AppError(404, 'Module not found');
      if (String(mod.projectId) !== String(bug.projectId)) throw new AppError(400, 'Module does not belong to the bug project');
      bug.moduleId = value.moduleId;
    }

    // assignees update: allow if (isReporter || isAssignee || isAdmin) OR (tester who is project member)
    if (value.assignees) {
      // check allowed actor
      if (!(isReporter || isAssignee || isAdmin || isTesterAndMember)) {
        throw new AppError(403, 'Forbidden to change assignees');
      }

      // ensure assignees belong to project members
      const project = await Project.findById(bug.projectId);
      const memberIds = project.members.map(String);
      const bad = value.assignees.filter(a => !memberIds.includes(String(a)));
      if (bad.length) throw new AppError(400, 'Assignees must be project members');

      bug.assignees = value.assignees;
    }

    await bug.save();

    await logActivity({
      bugId: bug._id,
      moduleId: bug.moduleId,
      actorId: req.user.id,
      action: 'update',
      from: before,
      to: bug.toObject()
    });

    res.json(bug);
  } catch (e) { next(e); }
}

/**
 * DELETE bug (reporter or admin)
 */
async function deleteBug(req, res, next) {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');

    // ensure access to project
    await ensureProjectAccessOrThrow(req.user, bug.projectId);

    const uid = req.user.id;
    const isReporter = String(bug.reportedBy) == uid;
    const isAdmin = req.user.role === 'admin';
    if (!isReporter && !isAdmin) throw new AppError(403, 'Only reporter or admin can delete');

    await bug.deleteOne();

    await logActivity({
      bugId: bug._id,
      moduleId: bug.moduleId,
      actorId: req.user.id,
      action: 'delete'
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
}

/**
 * changeStatus: enforce transitions and canUpdateStatus (as before)
 */
async function changeStatus(req, res, next) {
  try {
    const { error, value } = statusSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');

    // ensure access
    await ensureProjectAccessOrThrow(req.user, bug.projectId);

    if (bug.status !== value.from) throw new AppError(400, 'From status mismatch');
    const allowed = allowedTransitions.get(bug.status) || [];
    if (!allowed.includes(value.to)) throw new AppError(400, 'Invalid transition');
    if (!canUpdateStatus(req.user, bug, value.to)) throw new AppError(403, 'Forbidden for this transition');

    const before = bug.status;
    bug.status = value.to;
    await bug.save();

    await logActivity({
      bugId: bug._id,
      moduleId: bug.moduleId,
      actorId: req.user.id,
      action: 'status_change',
      from: before,
      to: value.to,
      note: value.note
    });

    res.json({ ok: true, status: bug.status });
  } catch (e) { next(e); }
}

/**
 * listActivities: ensure viewer is allowed (admin or project member)
 */
async function listActivities(req, res, next) {
  try {
    const bug = await Bug.findById(req.params.id).select('projectId');
    if (!bug) throw new AppError(404, 'Bug not found');

    // ensure access
    await ensureProjectAccessOrThrow(req.user, bug.projectId);

    const acts = await Activity.find({ bugId: req.params.id }).sort({ createdAt: -1 });
    res.json({ data: acts });
  } catch (e) { next(e); }
}

module.exports = { listBugs, createBug, getBug, patchBug, deleteBug, changeStatus, listActivities };
