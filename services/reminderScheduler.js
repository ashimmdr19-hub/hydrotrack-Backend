const cron = require('node-cron');
const User = require('../models/User');
const WaterLog = require('../models/WaterLog');
const userService = require('./userService');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const { getPeriodKey } = require('../utils/ema');

/**
 * Gets the period information (name, EMA field, default fraction of daily goal, and cumulative period targets).
 */
const getPeriodDetails = (now = new Date()) => {
  const hour = now.getHours();
  if (hour < 12) {
    return {
      periodName: 'Morning',
      periodKey: 'emaMorning',
      defaultRatio: 0.3,
      periodIndex: 0,
    };
  } else if (hour < 18) {
    return {
      periodName: 'Afternoon',
      periodKey: 'emaAfternoon',
      defaultRatio: 0.4,
      periodIndex: 1,
    };
  } else {
    return {
      periodName: 'Evening',
      periodKey: 'emaEvening',
      defaultRatio: 0.3,
      periodIndex: 2,
    };
  }
};

/**
 * Calculates cumulative expected water intake (ml) up to the current period.
 */
const getCumulativeExpectedTarget = (user, periodDetails) => {
  const morningExp = user.emaMorning > 0 ? user.emaMorning : user.dailyGoal * 0.3;
  const afternoonExp = user.emaAfternoon > 0 ? user.emaAfternoon : user.dailyGoal * 0.4;
  const eveningExp = user.emaEvening > 0 ? user.emaEvening : user.dailyGoal * 0.3;

  if (periodDetails.periodIndex === 0) {
    return Math.round(morningExp);
  } else if (periodDetails.periodIndex === 1) {
    return Math.round(morningExp + afternoonExp);
  } else {
    return user.dailyGoal;
  }
};

/**
  Checks users and sends adaptive EMA-based water reminders if needed
 */
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const periodDetails = getPeriodDetails(now);
    
    // Find all users who have active device tokens registered
    const users = await User.find({
      deviceTokens: { $exists: true, $not: { $size: 0 } },
    });

    for (const user of users) {
      // Calculate total water logged today
      const todayLogs = await WaterLog.find({
        user: user._id,
        timestamp: { $gte: todayStart },
      });

      const totalToday = todayLogs.reduce((sum, log) => sum + log.amount, 0);

      // If user has already reached their daily goal, skip reminder
      if (totalToday >= user.dailyGoal) {
        continue;
      }

      // Calculate cumulative expected intake up to current period
      const cumulativeTarget = getCumulativeExpectedTarget(user, periodDetails);

      // If user is already on track for the current period, skip sending notification (prevents notification fatigue)
      if (totalToday >= cumulativeTarget) {
        console.log(`ℹ️ User ${user.email} is on track for ${periodDetails.periodName} (${totalToday}ml / target ${cumulativeTarget}ml). Skipping notification.`);
        continue;
      }

      // Calculate current period expected EMA volume
      const currentPeriodEma = user[periodDetails.periodKey];
      const hasEmaHistory = currentPeriodEma && currentPeriodEma > 0;
      const periodExpectedVolume = hasEmaHistory
        ? Math.round(currentPeriodEma)
        : Math.round(user.dailyGoal * periodDetails.defaultRatio);

      const remaining = user.dailyGoal - totalToday;
      const title = `💧 ${periodDetails.periodName} Hydration Reminder!`;
      
      let body;
      if (hasEmaHistory) {
        body = `Hi ${user.name || 'there'}! Based on your routine, you usually drink ~${periodExpectedVolume}ml in the ${periodDetails.periodName.toLowerCase()}. You've logged ${totalToday}ml out of ${user.dailyGoal}ml today. Drink ${remaining}ml more to reach your goal!`;
      } else {
        body = `Hi ${user.name || 'there'}! You've logged ${totalToday}ml out of ${user.dailyGoal}ml today. Drink ${remaining}ml more to reach your ${periodDetails.periodName.toLowerCase()} goal!`;
      }

      try {
        await userService.sendPushNotification(user._id, title, body);
        console.log(`✅ EMA Adaptive push reminder sent to user: ${user.email} (${periodDetails.periodName})`);
      } catch (err) {
        console.error(`⚠️ Failed to send reminder to ${user.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('🔥 Error running reminder scheduler:', error);
  }
};

/**
 * Initializes cron jobs for automated push notifications.
 * Default schedule: Every 2 hours between 8 AM and 9 PM (at minute 0 of the hour).
 */
const initReminderScheduler = () => {
  // Cron syntax: 0 8-21/2 * * * -> At minute 0 past every 2nd hour from 8 through 21
  cron.schedule('0 8-21/2 * * *', () => {
    console.log('⏰ Running scheduled hydration reminder job...');
    checkAndSendReminders();
  });

  console.log('🔔 EMA-Adaptive Hydration Reminder Scheduler initialized successfully (runs every 2 hours between 8 AM - 9 PM)');
};

module.exports = {
  initReminderScheduler,
  checkAndSendReminders,
};
