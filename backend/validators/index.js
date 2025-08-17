const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin','tester','developer').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const userCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('tester','developer','admin').required()
});

const projectCreateSchema = Joi.object({
  name: Joi.string().min(2).required(),
  description: Joi.string().allow('', null),
  members: Joi.array().items(Joi.string())
});

const projectMemberSchema = Joi.object({
  add: Joi.array().items(Joi.string()),
  remove: Joi.array().items(Joi.string())
}).or('add','remove');

const bugCreateSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().allow('', null),
  assignees: Joi.array().items(Joi.string())
});

const bugUpdateSchema = Joi.object({
  title: Joi.string().min(3),
  description: Joi.string().allow('', null),
  assignees: Joi.array().items(Joi.string())
}).min(1);

const statusSchema = Joi.object({
  from: Joi.string().valid('open','solved','closed','reopened').required(),
  to: Joi.string().valid('open','solved','closed','reopened').required(),
  note: Joi.string().allow('', null)
});

module.exports = {
  registerSchema,
  loginSchema,
  userCreateSchema,
  projectCreateSchema,
  projectMemberSchema,
  bugCreateSchema,
  bugUpdateSchema,
  statusSchema
};
