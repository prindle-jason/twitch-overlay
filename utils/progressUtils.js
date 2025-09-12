function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Returns an ease-in/ease-out timing curve value (0..1) given progress (0..1) and easeTime (0..0.5).
 * Creates a curve that starts at 0, ramps up to 1, stays at 1, then ramps back down to 0.
 * - easeTime: fraction of duration for ease-in and ease-out phases (e.g., 0.25 for 25% each).
 */
export function getEaseInOutProgress(progress, easeTime = 0.25) {
  const t = clamp01(progress);
  if (t < easeTime) { // Ease in
    return t / easeTime;
  } else if (t > 1 - easeTime) { // Ease out
    return (1 - t) / easeTime;
  } else { // Full intensity
    return 1;
  }
}