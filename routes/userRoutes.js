const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);
router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);
router.post('/device-token', userController.registerDeviceToken);

module.exports = router;
