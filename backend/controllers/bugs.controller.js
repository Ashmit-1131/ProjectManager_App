const Bug = require('../models/Bug');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { bugCreateSchema, bugUpdateSchema, statusSchema } = require('../validators');
const { AppError } = require('../utils/errors');

const allowedTransitions = new Map([
  ['open', ['solved']],
  ['solved', ['closed','reopened']],
  ['closed', ['reopened']],
  ['reopened', ['solved']]
]);

function canUpdateStatus(user, bug, to) {
  // Admin always allowed
  if (user.role === 'admin') return true;
  const uid = user.id;
  const isAssignee = bug.assignees.map(String).includes(uid);
  const isReporter = String(bug.reportedBy) === uid;
  if (!isAssignee && !isReporter) return false;
  if (to === 'closed' && !(user.role === 'tester')) return false; // only tester/admin can close
  return true;
}

async function listBugs(req, res, next) {
  try {
    const { projectId } = req.params;
    const { status, assignee, page = 1, limit = 20 } = req.query;
    const q = { projectId };
    if (status) q.status = status;
    if (assignee) q.assignees = assignee;
    const data = await Bug.find(q).skip((page-1)*limit).limit(Number(limit));
    const total = await Bug.countDocuments(q);
    res.json({ data, total });
  } catch (e) { next(e); }
}

async function createBug(req, res, next) {
  try {
    const { projectId } = req.params;
    const { error, value } = bugCreateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    // assignees must be subset of project members
    const assignees = value.assignees || [];
    if (assignees.length) {
      const memberIds = project.members.map(String);
      const bad = assignees.filter(a => !memberIds.includes(String(a)));
      if (bad.length) throw new AppError(400, 'Assignees must be project members');
    }

    //new: ensure reporter (current user) is a member of the project
    const reporterId = req.user.id;
    const isMember = project.members.map(String).includes(String(reporterId));
    if (!isMember) {
      // user isn't assigned to this project => forbid creating bugs
      throw new AppError(403, 'You are not assigned to this project');
    }

    const bug = await Bug.create({
      projectId,
      title: value.title,
      description: value.description || '',
      reportedBy: req.user.id,
      assignees
    });
    await Activity.create({ bugId: bug._id, actorId: req.user.id, action: 'create', to: bug });
    res.status(201).json(bug);
  } catch (e) { next(e); }
}


async function getBug(req, res, next) {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');
    res.json(bug);
  } catch (e) { next(e); }
}

async function patchBug(req, res, next) {
  try {
    const { error, value } = bugUpdateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');

    // ownership: reporter, assignee, or admin
    const uid = req.user.id;
    const isAssignee = bug.assignees.map(String).includes(uid);
    const isReporter = String(bug.reportedBy) === uid;
    const isAdmin = req.user.role === 'admin';
    if (!isAssignee && !isReporter && !isAdmin) throw new AppError(403, 'Forbidden');

    const before = { ...bug.toObject() };
    if (value.title) bug.title = value.title;
    if (value.description !== undefined) bug.description = value.description;
    if (value.assignees) {
      // ensure assignees belong to project members
      const project = await Project.findById(bug.projectId);
      const memberIds = project.members.map(String);
      const bad = value.assignees.filter(a => !memberIds.includes(String(a)));
      if (bad.length) throw new AppError(400, 'Assignees must be project members');
      bug.assignees = value.assignees;
    }
    await bug.save();
    await Activity.create({ bugId: bug._id, actorId: req.user.id, action: 'update', from: before, to: bug });
    res.json(bug);
  } catch (e) { next(e); }
}

async function deleteBug(req, res, next) {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');
    const uid = req.user.id;
    const isReporter = String(bug.reportedBy) == uid;
    const isAdmin = req.user.role === 'admin';
    if (!isReporter && !isAdmin) throw new AppError(403, 'Only reporter or admin can delete');
    await bug.deleteOne();
    await Activity.create({ bugId: bug._id, actorId: req.user.id, action: 'delete' });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function changeStatus(req, res, next) {
  try {
    const { error, value } = statusSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const bug = await Bug.findById(req.params.id);
    if (!bug) throw new AppError(404, 'Bug not found');
    if (bug.status !== value.from) throw new AppError(400, 'From status mismatch');
    const allowed = allowedTransitions.get(bug.status) || [];
    if (!allowed.includes(value.to)) throw new AppError(400, 'Invalid transition');
    if (!canUpdateStatus(req.user, bug, value.to)) throw new AppError(403, 'Forbidden for this transition');

    const before = bug.status;
    bug.status = value.to;
    await bug.save();
    await Activity.create({ bugId: bug._id, actorId: req.user.id, action: 'status_change', from: before, to: value.to, note: value.note });
    res.json({ ok: true, status: bug.status });
  } catch (e) { next(e); }
}

async function listActivities(req, res, next) {
  try {
    const acts = await Activity.find({ bugId: req.params.id }).sort({ createdAt: -1 });
    res.json({ data: acts });
  } catch (e) { next(e); }
}

module.exports = { listBugs, createBug, getBug, patchBug, deleteBug, changeStatus, listActivities };
