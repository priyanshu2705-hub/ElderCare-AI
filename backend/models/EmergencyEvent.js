const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    elderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    triggerType: { type: String, enum: ['button', 'voice', 'text'], default: 'button' },
    locationShared: { type: Boolean, default: false },
    location: { lat: Number, lng: Number, accuracy: Number },
    // Always false in this MVP: no SMS/push/call is sent by the server.
    contactNotified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'resolved', 'cancelled'], default: 'active' },
  },
  { versionKey: false }
);
module.exports = mongoose.model('EmergencyEvent', schema);
