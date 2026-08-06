const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const calculateDailyGoal = require('../utils/calculateGoal');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    age: { type: Number, required: true, min: 10 },
    gender: { type: String, enum: ['male', 'female'], required: true },
    weight: { type: Number, required: true, min: 20 },
    activityLevel: { type: String, enum: ['sedentary', 'moderate', 'active', 'athlete'], required: true },
    dailyGoal: { type: Number, default: 0 },
    emaMorning: { type: Number, default: 0 },
    emaAfternoon: { type: Number, default: 0 },
    emaEvening: { type: Number, default: 0 },
    engagementState: { type: String, enum: ['NewUser', 'OnTrack', 'StreakActive', 'Missed', 'Inactive', 'RewardGiven'], default: 'NewUser' },
    streakDays: { type: Number, default: 0 },
    lastLogAt: { type: Date },
    lastReminderMissedAt: { type: Date },
    rewardBadges: [{ type: String }],
    deviceTokens: [{ type: String }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified('weight') || this.isModified('activityLevel') || this.isModified('gender')) {
    this.dailyGoal = calculateDailyGoal({
      weight: this.weight,
      activityLevel: this.activityLevel,
      gender: this.gender,
    });
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
