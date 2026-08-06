const mongoose = require('mongoose');

const waterLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    timestamp: { type: Date, default: Date.now },
    period: { type: String, enum: ['morning', 'afternoon', 'evening'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WaterLog', waterLogSchema);
