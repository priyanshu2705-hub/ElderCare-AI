const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/schemas');

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    date: { type: String, required: true }, // YYYY-MM-DD (elder's timezone)
    time: { type: String, required: true, default: '09:00' }, // HH:mm
    category: { type: String, enum: CATEGORIES, default: 'general' },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
    completedAt: Date,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
schema.index({ userId: 1, date: 1, time: 1 });
module.exports = mongoose.model('Reminder', schema);
