function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// ============================================================================
// Fade/Envelope Functions (Attack/Release)
// ============================================================================

/** Fade in from 0→1 over fadeTime, then hold at 1 */
function fadeIn(t: number, fadeTime = 0.25): number {
  if (t < fadeTime) {
    return t / fadeTime;
  } else {
    return 1;
  }
}

/** Fade in from 0→1, hold, then fade out to 0 (creates an envelope) */
function fadeInOut(t: number, fadeTime = 0.25): number {
  if (t < fadeTime) {
    return t / fadeTime;
  } else if (t > 1 - fadeTime) {
    return (1 - t) / fadeTime;
  } else {
    return 1;
  }
}

// ============================================================================
// Linear
// ============================================================================

function linear(t: number): number {
  return t; // Very simple
}

// ============================================================================
// Quadratic Easing (Traditional)
// ============================================================================

/** Quadratic ease-in: slow start, accelerating */
function easeInQuad(t: number): number {
  return t * t;
}

/** Quadratic ease-out: fast start, decelerating */
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/** Quadratic ease-in-out: slow start and end, fast middle */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ============================================================================
// Cubic Easing
// ============================================================================

/** Cubic ease-in: slower start than quadratic */
function easeInCubic(t: number): number {
  return t * t * t;
}

/** Cubic ease-out: smoother deceleration */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Cubic ease-in-out: smooth acceleration and deceleration */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ============================================================================
// Timing Function Dispatcher
// ============================================================================

export enum TimingCurve {
  // Fade/Envelope
  FADE_IN = "FADE_IN",
  FADE_IN_OUT = "FADE_IN_OUT",

  // Linear
  LINEAR = "LINEAR",

  // Quadratic
  EASE_IN_QUAD = "EASE_IN_QUAD",
  EASE_OUT_QUAD = "EASE_OUT_QUAD",
  EASE_IN_OUT_QUAD = "EASE_IN_OUT_QUAD",

  // Cubic
  EASE_IN_CUBIC = "EASE_IN_CUBIC",
  EASE_OUT_CUBIC = "EASE_OUT_CUBIC",
  EASE_IN_OUT_CUBIC = "EASE_IN_OUT_CUBIC",
}

/**
 * Apply a timing function to a normalized time value.
 *
 * @param t - Normalized time (0-1)
 * @param timingFn - Which timing function to apply
 * @param fadeTime - For fade functions, the proportion of time to fade (0-0.5)
 */
export function applyTiming(
  t: number,
  timingFn: TimingCurve = TimingCurve.FADE_IN_OUT,
  fadeTime: number = 0.25
): number {
  t = clamp01(t);
  switch (timingFn) {
    // Fade/Envelope
    case TimingCurve.FADE_IN:
      return fadeIn(t, fadeTime);
    case TimingCurve.FADE_IN_OUT:
      return fadeInOut(t, fadeTime);

    // Linear
    case TimingCurve.LINEAR:
      return linear(t);

    // Quadratic
    case TimingCurve.EASE_IN_QUAD:
      return easeInQuad(t);
    case TimingCurve.EASE_OUT_QUAD:
      return easeOutQuad(t);
    case TimingCurve.EASE_IN_OUT_QUAD:
      return easeInOutQuad(t);

    // Cubic
    case TimingCurve.EASE_IN_CUBIC:
      return easeInCubic(t);
    case TimingCurve.EASE_OUT_CUBIC:
      return easeOutCubic(t);
    case TimingCurve.EASE_IN_OUT_CUBIC:
      return easeInOutCubic(t);
  }
}
