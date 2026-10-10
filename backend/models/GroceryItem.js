const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    quantity: { type: String, trim: true, maxlength: 40 },
    bought: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);
module.exports = mongoose.model('GroceryItem', schema);
