const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const hydrationController = require('../controllers/hydrationController');

const router = express.Router();

router.use(authMiddleware);

// Hydration Log Endpoints
router.post('/log', hydrationController.logWater);
router.delete('/log/:id', hydrationController.deleteWaterLog); // <-- Route for deleting a specific log
router.delete('/log/today', hydrationController.clearTodayLog); // <-- Route for clearing all logs today

// Stats Endpoints
router.get('/stats/daily', hydrationController.getDailyStats);
router.get('/stats/weekly', hydrationController.getWeeklyStats);

// Reminder Endpoints
router.get('/reminders', hydrationController.getAdaptiveReminders);
router.post('/reminders/push', hydrationController.sendPushReminder);

module.exports = router;
