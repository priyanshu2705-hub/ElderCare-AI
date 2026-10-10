const mongoose = require('mongoose');

// Minimal, non-sensitive log lines like "Completed: Water the plants".
const schema = new mongoose.Schema(
  {
    elderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    summary: { type: String, required: true, maxlength: 200 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
module.exports = mongoose.model('ActivityLog', schema);
