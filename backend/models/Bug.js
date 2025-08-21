const { Schema, model } = require('mongoose');

const BugSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true }, // now required
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'solved', 'closed', 'reopened'], default: 'open', index: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = model('Bug', BugSchema);
