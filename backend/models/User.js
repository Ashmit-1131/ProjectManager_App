const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
 name:{type:String,required:true},
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin','tester','developer'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = model('User', UserSchema);
