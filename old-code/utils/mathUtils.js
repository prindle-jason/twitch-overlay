// utils/mathUtils.js
// Mathematical utility functions

/**
 * Get a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
export function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Clamp a value to stay within min and max bounds
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 */
export function getClamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
