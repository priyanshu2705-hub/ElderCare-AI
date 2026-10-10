const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: String, required: true },
    time: { type: String, required: true, default: '10:00' },
    location: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false }
);
module.exports = mongoose.model('Appointment', schema);
