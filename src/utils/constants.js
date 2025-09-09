

// utils/constants.js
/**
 * Returns remaining time in milliseconds between a target date and now
 * @param {Date} targetTime
 * @returns {number} milliseconds remaining
 */
export function getRemainingTime(targetTime) {
  if (!targetTime) return 0;
  const now = new Date();
  return targetTime - now;
}
