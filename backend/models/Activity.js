const { Schema, model } = require('mongoose');

const ActivitySchema = new Schema({
  bugId: { type: Schema.Types.ObjectId, ref: 'Bug', required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['create', 'update', 'status_change', 'comment', 'delete'], required: true },
  from: Schema.Types.Mixed,
  to: Schema.Types.Mixed,
  note: String
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = model('Activity', ActivitySchema);
