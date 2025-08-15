const Joi = require('joi');

const registerSchema = Joi.object({
    name:Joi.string().email().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin','tester','developer').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports={
    registerSchema,
    loginSchema
}