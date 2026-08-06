const Joi = require('joi');
const userService = require('../services/userService');

const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  age: Joi.number().integer().min(10).optional(),
  gender: Joi.string().valid('male', 'female').optional(),
  weight: Joi.number().min(20).optional(),
  activityLevel: Joi.string().valid('sedentary', 'moderate', 'active', 'athlete').optional(),
});

const deviceTokenSchema = Joi.object({
  token: Joi.string().min(10).required(),
});

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const user = await userService.updateProfile(req.user._id, value);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const registerDeviceToken = async (req, res, next) => {
  try {
    const { error, value } = deviceTokenSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const user = await userService.registerDeviceToken(req.user._id, value.token);
    res.json({ deviceTokens: user.deviceTokens });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  registerDeviceToken,
};
