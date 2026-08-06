const Joi = require('joi');
const hydrationService = require('../services/hydrationService');

const logSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  timestamp: Joi.date().optional(),
});

const logWater = async (req, res, next) => {
  try {
    const { error, value } = logSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const entry = await hydrationService.logWater(req.user, value);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

const getDailyStats = async (req, res, next) => {
  try {
    const stats = await hydrationService.getDailyStats(req.user._id, req.query.date ? new Date(req.query.date) : undefined);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

const getWeeklyStats = async (req, res, next) => {
  try {
    const stats = await hydrationService.getWeeklyStats(req.user._id, req.query.date ? new Date(req.query.date) : undefined);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

const getAdaptiveReminders = async (req, res, next) => {
  try {
    const payload = hydrationService.getAdaptiveReminderTimes(req.user);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

const sendPushReminder = async (req, res, next) => {
  try {
    const payload = await hydrationService.sendPushReminder(req.user);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

// ===========================================================================
// UPDATED DELETE CONTROLLER FUNCTIONS (WITH DEBUG LOGGING)
// ===========================================================================

const deleteWaterLog = async (req, res, next) => {
  try {
    console.log("=== DELETE REQUEST RECEIVED ===");
    console.log("Received Log ID:", req.params.id);
    console.log("User ID:", req.user ? req.user._id : 'NO USER');

    const { id } = req.params;
    const deletedLog = await hydrationService.deleteLogById(id, req.user._id);

    console.log("Database Result:", deletedLog);

    if (!deletedLog) {
      console.log("❌ Deletion Failed: Log not found or User ID mismatch");
      return res.status(404).json({ message: 'Water log not found or unauthorized' });
    }

    console.log("✅ Log successfully deleted from MongoDB!");
    res.json({ message: 'Water log deleted successfully', deletedLog });
  } catch (err) {
    console.error("🔥 Error in deleteWaterLog:", err);
    next(err);
  }
};

const clearTodayLog = async (req, res, next) => {
  try {
    console.log("=== CLEAR TODAY LOG REQUEST RECEIVED ===");
    console.log("User ID:", req.user ? req.user._id : 'NO USER');

    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await hydrationService.clearDailyLogs(req.user._id, date);

    console.log("Clear Today Result:", result);
    res.json({ message: 'Today water logs cleared successfully', result });
  } catch (err) {
    console.error("🔥 Error in clearTodayLog:", err);
    next(err);
  }
};

module.exports = {
  logWater,
  getDailyStats,
  getWeeklyStats,
  getAdaptiveReminders,
  sendPushReminder,
  deleteWaterLog,
  clearTodayLog,
};