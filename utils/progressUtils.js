function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Returns a fade-in/fade-out value (0..1) given progress (0..1) and fadeTime (0..0.5).
 * - fadeTime: fraction of duration for fade-in and fade-out (e.g., 0.25 for 25%).
 */
export function getFadeInOutProgress(progress, fadeTime = 0.25) {
  const t = clamp01(progress);
  if (t < fadeTime) { // Fade in
    return t / fadeTime;
  } else if (t > 1 - fadeTime) { // Fade out
    return (1 - t) / fadeTime;
  } else { // Fully visible
    return 1;
  }
}