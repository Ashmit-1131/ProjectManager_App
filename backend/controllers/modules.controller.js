const mongoose = require('mongoose');
const Module = require('../models/Module');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { moduleCreateSchema } = require('../validators');
const { AppError } = require('../utils/errors');

/**
 * GET /projects/:projectId/modules
 */
async function listModules(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!projectId) throw new AppError(400, 'projectId is required');

    //  Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid projectId');
    }

    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const uid = req.user.id;
    const role = req.user.role;

    if (role !== 'admin') {
      const isMember = project.members.map(String).includes(String(uid));
      if (!isMember) throw new AppError(403, 'You are not assigned to this project');
    }

    const modules = await Module.find({ projectId })
      .sort({ createdAt: -1 })
      .populate({ path: 'projectId', select: 'name' });

    const data = modules.map(m => ({
      _id: m._id,
      name: m.name,
      project: m.projectId
        ? { _id: m.projectId._id, name: m.projectId.name }
        : null,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({ data });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /projects/:projectId/modules
 */
async function createModule(req, res, next) {
  try {
    const { projectId } = req.params;
    const { error, value } = moduleCreateSchema.validate(req.body);
    if (error) throw new AppError(400, error.message);

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'Invalid projectId');
    }

    const project = await Project.findById(projectId);
    if (!project) throw new AppError(404, 'Project not found');

    const uid = req.user.id;
    const role = req.user.role;

    if (role !== 'admin') {
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

    await Activity.create({
      moduleId: mod._id,
      actorId: uid,
      action: 'create_module',
      to: mod
    }).catch(() => {});

    // Retrieve and return module with populated project name
    const populatedMod = await Module.findById(mod._id)
      .populate({ path: 'projectId', select: 'name' });

    const responseMod = {
      _id: populatedMod._id,
      name: populatedMod.name,
      project: populatedMod.projectId
        ? { _id: populatedMod.projectId._id, name: populatedMod.projectId.name }
        : null,
      createdBy: populatedMod.createdBy,
      createdAt: populatedMod.createdAt,
      updatedAt: populatedMod.updatedAt
    };

    res.status(201).json({ data: responseMod });

  } catch (e) {
    next(e);
  }
}

/**
 * GET /modules/my-modules
 */
async function listMyModules(req, res, next) {
  try {
    const uid = req.user.id;
    const role = req.user.role;

    let modules;

    if (role === 'admin') {
      modules = await Module.find()
        .sort({ createdAt: -1 })
        .populate({ path: 'projectId', select: 'name' });
    } else {
      const projects = await Project.find({ members: uid }).select('_id').lean();
      const projectIds = projects.map(p => p._id);
      if (!projectIds.length) return res.json({ data: [] });

      modules = await Module.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .populate({ path: 'projectId', select: 'name' });
    }

    const data = modules.map(m => ({
      _id: m._id,
      name: m.name,
      project: m.projectId
        ? { _id: m.projectId._id, name: m.projectId.name }
        : null,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    res.json({ data });
  } catch (e) {
    next(e);
  }
}

module.exports = { listModules, createModule, listMyModules };
