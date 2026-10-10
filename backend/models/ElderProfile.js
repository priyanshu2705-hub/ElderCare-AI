const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    age: { type: Number, min: 40, max: 120 },
    preferences: {
      interactionMode: { type: String, enum: ['voice', 'camera', 'text'], default: 'voice' },
      language: { type: String, default: 'en-IN' },
    },
    accessibility: {
      textSize: { type: String, enum: ['large', 'xlarge', 'xxlarge'], default: 'large' },
      highContrast: { type: Boolean, default: false },
      voiceSpeed: { type: Number, min: 0.5, max: 1.5, default: 0.9 },
      voiceEnabled: { type: Boolean, default: true },
    },
    onboardingDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = mongoose.model('ElderProfile', schema);
