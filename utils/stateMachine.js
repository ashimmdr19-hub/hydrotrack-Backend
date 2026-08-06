const states = {
  NewUser: 'NewUser',
  OnTrack: 'OnTrack',
  StreakActive: 'StreakActive',
  Missed: 'Missed',
  Inactive: 'Inactive',
  RewardGiven: 'RewardGiven',
};

const getNextState = ({ currentState, lastLogAt, lastReminderMissedAt, streakDays, inactivityThresholdDays = 3 }) => {
  const now = Date.now();
  const lastLog = lastLogAt ? new Date(lastLogAt).getTime() : null;
  const missed = lastReminderMissedAt ? new Date(lastReminderMissedAt).getTime() : null;

  if (!lastLog) return states.NewUser;
  if (streakDays >= 30) return states.RewardGiven;
  if (streakDays >= 7) return states.StreakActive;
  if (missed && now - missed < 86400000) return states.Missed;
  if (lastLog && now - lastLog > inactivityThresholdDays * 86400000) return states.Inactive;
  return states.OnTrack;
};

module.exports = {
  states,
  getNextState,
};
