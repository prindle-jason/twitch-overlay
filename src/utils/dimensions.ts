/**
 * Calculate uniform scale to fit longest dimension within maxSize while maintaining aspect ratio.
 */
export function calculateScaleForMax(
  baseWidth: number,
  baseHeight: number,
  maxSize: number
): number {
  const longerDimension = Math.max(baseWidth, baseHeight);
  return maxSize / longerDimension;
}
