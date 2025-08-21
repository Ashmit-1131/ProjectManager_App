const Module = require('../models/Module');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { moduleCreateSchema } = require('../validators');
const { AppError } = require('../utils/errors');

/**
 * GET /projects/:projectId/modules
 * - Admin: allowed for any project
 * - Tester/Developer: allowed only if they are a member of the project
 *
 * Returns modules populated with project name.
 */
async function listModules(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!projectId) throw new AppError(400, 'projectId is required');

    // ensure project exists
    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const uid = req.user.id;
    const role = req.user.role;

    // Admin may list modules for any project.
    if (role !== 'admin') {
      // Tester and Developer must be project members to view modules
      const isMember = project.members.map(String).includes(String(uid));
      if (!isMember) throw new AppError(403, 'You are not assigned to this project');
    }

    // populate only project name to keep response small
    const modules = await Module.find({ projectId })
      .sort({ createdAt: -1 })
      .populate({ path: 'projectId', select: 'name' });

    const data = modules.map(m => ({
      _id: m._id,
      name: m.name,
      project: m.projectId ? { _id: m.projectId._id, name: m.projectId.name } : null,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({ data });
  } catch (e) { next(e); }
}

/**
 * POST /projects/:projectId/modules
 * - Admin: allowed for any project (even if not member)
 * - Tester: allowed only if assigned to project
 * - Developer: NOT allowed
 */
async function createModule(req, res, next) {
  try {
    const { projectId } = req.params;
    const { error, value } = moduleCreateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const uid = req.user.id;
    const role = req.user.role;

    // Admin can create modules on any project
    if (role !== 'admin') {
      // Non-admins: only 'tester' who is a project member is allowed
      if (role !== 'tester') {
        throw new AppError(403, 'Only tester or admin can create modules');
      }
      const isMember = project.members.map(String).includes(String(uid));
      if (!isMember) throw new AppError(403, 'You are not assigned to this project');
    }

    const mod = await Module.create({
      projectId,
      name: value.name,
      createdBy: uid
    });

    // log activity (best-effort)
    await Activity.create({ moduleId: mod._id, actorId: uid, action: 'create_module', to: mod }).catch(() => {});
    res.status(201).json(mod);
  } catch (e) { next(e); }
}

/**
 * GET /modules/my-modules
 * - Returns modules belonging to projects where the current user is a member.
 * - Admin will receive modules for all projects (if desired you can change to only assigned projects).
 */
async function listMyModules(req, res, next) {
  try {
    const uid = req.user.id;
    const role = req.user.role;

    // Admin: return all modules (if you want admins to only see assigned, change this)
    if (role === 'admin') {
      const modules = await Module.find().sort({ createdAt: -1 }).populate({ path: 'projectId', select: 'name' });
      const data = modules.map(m => ({
        _id: m._id,
        name: m.name,
        project: m.projectId ? { _id: m.projectId._id, name: m.projectId.name } : null,
        createdBy: m.createdBy,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      }));
      return res.json({ data });
    }

    // For tester/developer: find projects where user is a member, then list modules
    const projects = await Project.find({ members: uid }).select('_id').lean();
    const projectIds = projects.map(p => p._id);
    if (!projectIds.length) return res.json({ data: [] });

    const modules = await Module.find({ projectId: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .populate({ path: 'projectId', select: 'name' });

    const data = modules.map(m => ({
      _id: m._id,
      name: m.name,
      project: m.projectId ? { _id: m.projectId._id, name: m.projectId.name } : null,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({ data });
  } catch (e) { next(e); }
}

module.exports = { listModules, createModule, listMyModules };
