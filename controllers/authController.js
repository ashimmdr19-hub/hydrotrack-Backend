const Joi = require('joi');
const authService = require('../services/authService');

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  age: Joi.number().integer().min(10).required(),
  gender: Joi.string().valid('male', 'female').required(),
  weight: Joi.number().min(20).required(),
  activityLevel: Joi.string().valid('sedentary', 'moderate', 'active', 'athlete').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const register = async (req, res, next) => {
  try {
    const normalizedBody = {
      ...req.body,
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
      age: Number(req.body?.age),
      gender: req.body?.gender?.toLowerCase(),
      weight: Number(req.body?.weight),
      activityLevel: req.body?.activityLevel?.toLowerCase(),
    };

    const { error, value } = registerSchema.validate(normalizedBody);
    if (error) return res.status(400).json({ message: error.message });

    const { user, token } = await authService.register(value);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { user, token } = await authService.login(value);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
};
