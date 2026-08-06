const User = require('../models/User');
const admin = require('../firebase'); // Adjust path if firebase.js is in root (e.g., '../../firebase')

const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const updateProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  Object.keys(updates).forEach((key) => {
    if (['name', 'age', 'gender', 'weight', 'activityLevel'].includes(key)) {
      user[key] = updates[key];
    }
  });

  await user.save();
  return user;
};

const registerDeviceToken = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.deviceTokens = user.deviceTokens || [];
  if (!user.deviceTokens.includes(token)) {
    user.deviceTokens.push(token);
    await user.save();
  }
  return user;
};

/**
 * Sends a Firebase push notification to all devices registered to the user
 */
const sendPushNotification = async (userId, title, body) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (!user.deviceTokens || user.deviceTokens.length === 0) {
    const err = new Error('No device tokens registered for this user');
    err.statusCode = 400;
    throw err;
  }

  const message = {
    notification: {
      title: title || '💧 Hydration Reminder!',
      body: body || 'Time to drink some water and stay hydrated!',
    },
    tokens: user.deviceTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Clean up expired or invalid tokens automatically
    if (response.failureCount > 0) {
      const validTokens = user.deviceTokens.filter((_, index) => {
        const error = response.responses[index].error;
        return !error || error.code !== 'messaging/registration-token-not-registered';
      });

      user.deviceTokens = validTokens;
      await user.save();
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification via FCM:', error);
    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile,
  registerDeviceToken,
  sendPushNotification,
};
