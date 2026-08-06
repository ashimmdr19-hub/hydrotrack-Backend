const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const register = async ({ name, email, password, age, gender, weight, activityLevel }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password, age, gender, weight, activityLevel });
  const token = signToken(user._id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id);
  user.password = undefined;
  return { user, token };
};

module.exports = {
  register,
  login,
  signToken,
};
