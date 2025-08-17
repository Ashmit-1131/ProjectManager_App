const Project = require('../models/Project');
const User = require('../models/User');
const { projectCreateSchema, projectMemberSchema } = require('../validators');
const { AppError } = require('../utils/errors');

async function listProjects(req, res, next) {
  try {
    const { status, member, page = 1, limit = 20 } = req.query;
    const q = {};
    if (status) q.status = status;
    if (member) q.members = member;
    const data = await Project.find(q).skip((page-1)*limit).limit(Number(limit));
    const total = await Project.countDocuments(q);
    res.json({ data, total });
  } catch (e) { next(e); }
}

async function createProject(req, res, next) {
  try {
    const { error, value } = projectCreateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const { name, description = '', members = [] } = value;
    // ensure members exist
    if (members.length) {
      const count = await User.countDocuments({ _id: { $in: members } });
      if (count !== members.length) throw new AppError(400, 'One or more members do not exist');
    }
    const project = await Project.create({ name, description, members });
    res.status(201).json(project);
  } catch (e) { next(e); }
}

async function getProject(req, res, next) {
  try {
    const proj = await Project.findById(req.params.id);
    if (!proj) throw new AppError(404, 'Project not found');
    res.json(proj);
  } catch (e) { next(e); }
}

async function patchProject(req, res, next) {
  try {
    const updates = {};
    ['name','description','status'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const proj = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!proj) throw new AppError(404, 'Project not found');
    res.json(proj);
  } catch (e) { next(e); }
}

async function deleteProject(req, res, next) {
  try {
    const proj = await Project.findByIdAndDelete(req.params.id);
    if (!proj) throw new AppError(404, 'Project not found');
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function patchMembers(req, res, next) {
  try {
    const { error, value } = projectMemberSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);
    const proj = await Project.findById(req.params.id);
    if (!proj) throw new AppError(404, 'Project not found');
    const add = value.add || [];
    const remove = value.remove || [];
    if (add.length) {
      const count = await require('../models/User').countDocuments({ _id: { $in: add } });
      if (count !== add.length) throw new AppError(400, 'One or more members do not exist');
    }
    proj.members = Array.from(new Set([
      ...proj.members.map(m => m.toString()),
      ...add.map(String)
    ])).filter(id => !remove.map(String).includes(id));
    await proj.save();
    res.json(proj);
  } catch (e) { next(e); }
}

module.exports = { listProjects, createProject, getProject, patchProject, deleteProject, patchMembers };
