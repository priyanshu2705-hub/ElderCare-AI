const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    elderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shareReminders: { type: Boolean, default: true },
    shareAppointments: { type: Boolean, default: true },
    shareGrocery: { type: Boolean, default: true },
    shareEmergencyEvents: { type: Boolean, default: true },
    // Documents are never stored by this app, and conversations are never stored.
    // The field exists so the policy is explicit, and the API forces it to false.
    shareDocuments: { type: Boolean, default: false },
    // "Last active" time and simple task activity such as "Reminder completed".
    shareActivity: { type: Boolean, default: true },
    // Family sees a location only if the elder tapped "Share my location" during
    // an emergency AND this is on.
    allowLocationInEmergency: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
module.exports = mongoose.model('PrivacySettings', schema);
