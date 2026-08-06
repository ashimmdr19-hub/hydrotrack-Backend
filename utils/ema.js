const ALPHA = 0.3;

const getPeriodKey = (timestamp = new Date()) => {
  const hour = new Date(timestamp).getHours();
  if (hour < 12) return 'emaMorning';
  if (hour < 18) return 'emaAfternoon';
  return 'emaEvening';
};

const updateEmaValue = (currentEma, latestVolume) => {
  if (!currentEma || currentEma === 0) {
    return latestVolume;
  }
  return Number((ALPHA * latestVolume + (1 - ALPHA) * currentEma).toFixed(2));
};

module.exports = {
  ALPHA,
  getPeriodKey,
  updateEmaValue,
};
