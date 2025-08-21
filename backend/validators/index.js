const Joi = require('joi');

// helper pattern for ObjectId
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'tester', 'developer').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const userCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('tester', 'developer', 'admin').required()
});

const projectCreateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow('', null),
  members: Joi.array().items(Joi.string())
});

const projectMemberSchema = Joi.object({
  add: Joi.array().items(Joi.string()),
  remove: Joi.array().items(Joi.string())
}).or('add', 'remove');

// Module create schema
const moduleCreateSchema = Joi.object({
  name: Joi.string().min(2).max(200).required()
});

// Bug create: moduleId optional in body (server can accept it from req.params)
const bugCreateSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().allow('', null),
  assignees: Joi.array().items(objectId),
  moduleId: objectId.optional() // optional here because create may use param
});

// Bug update: allow updating moduleId optionally (validate objectId)
const bugUpdateSchema = Joi.object({
  title: Joi.string().min(3),
  description: Joi.string().allow('', null),
  assignees: Joi.array().items(objectId),
  moduleId: objectId.optional()
}).min(1);

const statusSchema = Joi.object({
  from: Joi.string().valid('open', 'solved', 'closed', 'reopened').required(),
  to: Joi.string().valid('open', 'solved', 'closed', 'reopened').required(),
  note: Joi.string().allow('', null)
});

module.exports = {
  registerSchema,
  loginSchema,
  userCreateSchema,
  projectCreateSchema,
  projectMemberSchema,
  moduleCreateSchema,
  bugCreateSchema,
  bugUpdateSchema,
  statusSchema
};
