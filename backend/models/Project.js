const { Schema, model, Types } = require('mongoose');

const ProjectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active','archived'], default: 'active' }
}, { timestamps: true });

module.exports = model('Project', ProjectSchema);
