const cron = require('node-cron');
const User = require('../models/User');
const WaterLog = require('../models/WaterLog');
const userService = require('./userService');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
  Checks users and sends water reminders if needed
 */
const checkAndSendReminders = async () => {
  try {
    const todayStart = startOfDay(new Date());
    
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

      // If user hasn't met their daily goal, send a friendly reminder push notification
      if (totalToday < user.dailyGoal) {
        const remaining = user.dailyGoal - totalToday;
        const title = '💧 Water Reminder!';
        const body = `Hi ${user.name || 'there'}! You've logged ${totalToday}ml out of ${user.dailyGoal}ml today. Drink ${remaining}ml more to reach your goal!`;

        try {
          await userService.sendPushNotification(user._id, title, body);
          console.log(`✅ Push reminder sent to user: ${user.email}`);
        } catch (err) {
          console.error(`⚠️ Failed to send reminder to ${user.email}:`, err.message);
        }
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

  console.log('🔔 Hydration Reminder Scheduler initialized successfully (runs every 2 hours between 8 AM - 9 PM)');
};

module.exports = {
  initReminderScheduler,
  checkAndSendReminders,
};
