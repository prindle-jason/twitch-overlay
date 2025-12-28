function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function getEaseInOutProgress(
  progress: number,
  easeTime = 0.25
): number {
  const t = clamp01(progress);
  if (t < easeTime) {
    return t / easeTime;
  } else if (t > 1 - easeTime) {
    return (1 - t) / easeTime;
  } else {
    return 1;
  }
}
