/* eslint-disable import/prefer-default-export */
// Calculate the number of days, number of hours and number of minutes it takes, given the time (in minutes)
// Used in: (1) ChallengeList, (2) BadgeAboutTab

export function calculateDayHourMinutes(time: number) {
  let day = 0;
  let hour = 0;
  let minute = 0;

  let completionTime = time;
  if (completionTime >= 1440) {
    day = Math.floor(completionTime / 1440);
    completionTime -= Math.floor(completionTime / 1440) * 1440;
  }
  if (completionTime >= 60) {
    hour = Math.floor(completionTime / 60);
    completionTime -= Math.floor(completionTime / 60) * 60;
  }
  if (completionTime < 60) minute = completionTime;

  return { day, hour, minute };
}
