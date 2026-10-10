const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    elderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    relationship: { type: String, trim: true, maxlength: 40 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    emergencyContact: { type: Boolean, default: false },
    // Set when a caregiver account with the same email exists. This link is what
    // gives that caregiver access to the elder's dashboard.
    caregiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sharingPermissions: {
      receiveEmergencyAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true, versionKey: false }
);
module.exports = mongoose.model('TrustedContact', schema);
