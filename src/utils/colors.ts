/**
 * Generate a random HSL color with high saturation and medium lightness.
 */
export const randomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
};

/**
 * Generate a random grayscale shade with bounded lightness percentage.
 */
export const randomGrayShade = (
  minLightnessPct = 50,
  maxLightnessPct = 80,
): string => {
  const min = Math.min(minLightnessPct, maxLightnessPct);
  const max = Math.max(minLightnessPct, maxLightnessPct);
  const lightness = min + Math.random() * (max - min);
  return `hsl(0, 0%, ${lightness.toFixed(1)}%)`;
};
