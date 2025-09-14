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

// Easing curve types
export const EaseCurve = {
  LINEAR: 'linear',
  QUADRATIC: 'quadratic',
  SINE: 'sine'
};

/**
 * Apply easing curve to a progress value (0..1)
 * @param {number} progress - Progress value (0..1)
 * @param {string} curve - Curve type: 'linear', 'quadratic', or 'sine'
 * @returns {number} Eased progress value (0..1)
 */
function applyCurve(progress, curve = EaseCurve.QUADRATIC) {
  switch (curve) {
    case EaseCurve.LINEAR:
      return progress;
    case EaseCurve.QUADRATIC:
      return progress * progress;
    case EaseCurve.SINE:
      return Math.sin(progress * Math.PI / 2);
    default:
      return progress * progress; // Default to quadratic
  }
}

/**
 * Returns an ease-in timing curve value (0..1) given progress (0..1).
 * Creates a smooth transition from 0 to 1.
 * - progress: current progress (0..1)
 * - curve: easing curve type ('linear', 'quadratic', 'sine')
 */
export function getEaseInProgress(progress, curve = EaseCurve.QUADRATIC) {
  return applyCurve(clamp01(progress), curve);
}

/**
 * Returns an ease-out timing curve value (0..1) given progress (0..1).
 * Creates a smooth transition from 1 to 0.
 * - progress: current progress (0..1)
 * - curve: easing curve type ('linear', 'quadratic', 'sine')
 */
export function getEaseOutProgress(progress, curve = EaseCurve.QUADRATIC) {
  return 1 - applyCurve(clamp01(progress), curve);
}