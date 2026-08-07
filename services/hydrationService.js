const WaterLog = require('../models/WaterLog');
const User = require('../models/User');
const { getPeriodKey, updateEmaValue } = require('../utils/ema');
const { getNextState } = require('../utils/stateMachine');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const hasSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
};

const logWater = async (user, { amount, timestamp }) => {
  const logTime = timestamp ? new Date(timestamp) : new Date();
  const periodKey = getPeriodKey(logTime);

  const waterLog = await WaterLog.create({
    user: user._id,
    amount,
    timestamp: logTime,
    period: periodKey.replace('ema', '').toLowerCase(),
  });

  const currentEma = user[periodKey] || 0;
  user[periodKey] = updateEmaValue(currentEma, amount);

  if (!user.lastLogAt || !hasSameDay(user.lastLogAt, logTime)) {
    const yesterday = new Date(logTime);
    yesterday.setDate(yesterday.getDate() - 1);

    if (user.lastLogAt && hasSameDay(user.lastLogAt, yesterday)) {
      user.streakDays += 1;
    } else {
      user.streakDays = 1;
    }
  }

  user.lastLogAt = logTime;
  user.engagementState = getNextState({
    currentState: user.engagementState,
    lastLogAt: user.lastLogAt,
    lastReminderMissedAt: user.lastReminderMissedAt,
    streakDays: user.streakDays,
  });

  if ([3, 7, 30].includes(user.streakDays) && !user.rewardBadges.includes(`${user.streakDays}-day`)) {
    user.rewardBadges.push(`${user.streakDays}-day`);
  }

  await user.save();

  return waterLog;
};

// ===========================================================================
// NEW DELETE METHODS ADDED HERE
// ===========================================================================

/**
 * Delete a single log entry by its document ID for a specific user
 */
const deleteLogById = async (logId, userId) => {
  // Hard delete from database matching document _id and user _id
  return await WaterLog.findOneAndDelete({ _id: logId, user: userId });
};

/**
 * Delete/Clear all log entries for a given date for a specific user
 */
const clearDailyLogs = async (userId, date = new Date()) => {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return await WaterLog.deleteMany({
    user: userId,
    timestamp: { $gte: start, $lt: end },
  });
};

// ===========================================================================

const getDailyStats = async (userId, date = new Date()) => {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const logs = await WaterLog.find({
    user: userId,
    timestamp: { $gte: start, $lt: end },
  }).sort('timestamp');

  const total = logs.reduce((sum, entry) => sum + entry.amount, 0);
  return { date: start, total, entries: logs };
};

const getWeeklyStats = async (userId, date = new Date()) => {
  const currentDay = startOfDay(date);
  const weekStart = new Date(currentDay);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekEnd = new Date(currentDay);
  weekEnd.setDate(weekEnd.getDate() + 1);

  const logs = await WaterLog.aggregate([
    {
      $match: {
        user: userId,
        timestamp: { $gte: weekStart, $lt: weekEnd },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        total: { $sum: '$amount' },
        entries: { $push: '$$ROOT' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyTotals = logs.map((row) => ({ date: row._id, total: row.total, entries: row.entries }));
  const totalAmount = dailyTotals.reduce((sum, day) => sum + day.total, 0);

  return {
    weekStart,
    weekEnd,
    totalAmount,
    dailyTotals,
  };
};

const getAdaptiveReminderTimes = (user) => {
  const recommendation = [];

  if (user.emaMorning > 0) {
    recommendation.push({ period: 'morning', expectedVolume: user.emaMorning, timeWindow: '7:00 AM - 10:00 AM' });
  }
  if (user.emaAfternoon > 0) {
    recommendation.push({ period: 'afternoon', expectedVolume: user.emaAfternoon, timeWindow: '12:00 PM - 3:00 PM' });
  }
  if (user.emaEvening > 0) {
    recommendation.push({ period: 'evening', expectedVolume: user.emaEvening, timeWindow: '6:00 PM - 9:00 PM' });
  }

  if (recommendation.length === 0) {
    recommendation.push({ period: 'morning', expectedVolume: Math.round(user.dailyGoal * 0.3), timeWindow: '7:00 AM - 10:00 AM' });
    recommendation.push({ period: 'afternoon', expectedVolume: Math.round(user.dailyGoal * 0.4), timeWindow: '12:00 PM - 3:00 PM' });
    recommendation.push({ period: 'evening', expectedVolume: Math.round(user.dailyGoal * 0.3), timeWindow: '6:00 PM - 9:00 PM' });
  }

  return {
    dailyGoal: user.dailyGoal,
    reminderPlan: recommendation,
  };
};

const userService = require('./userService');

const sendPushReminder = async (user) => {
  return await userService.sendPushNotification(
    user._id,
    '💧 Hydration Reminder!',
    'Time to drink water and stay on track with your hydration goals!'
  );
};

module.exports = {
  logWater,
  deleteLogById,   // <-- Added
  clearDailyLogs,  // <-- Added
  getDailyStats,
  getWeeklyStats,
  getAdaptiveReminderTimes,
  sendPushReminder,
};
