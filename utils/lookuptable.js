const activityMultipliers = {
  sedentary: 0.033,
  moderate: 0.038,
  active: 0.043,
  athlete: 0.05,
};

const genderFactors = {
  male: 1.0,
  female: 0.9,
};

const calculateDailyGoal = ({ weight, activityLevel, gender }) => {
  const multiplier = activityMultipliers[activityLevel] || activityMultipliers.sedentary;
  const genderFactor = genderFactors[gender] || 1.0;
  const goal = weight * multiplier * genderFactor * 1000;
  return Math.round(goal);
};

module.exports = calculateDailyGoal;
