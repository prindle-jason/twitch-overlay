import { logger } from "./logger";

export type ScaleConfig = number | { x?: number; y?: number };

export type ImageScaleStrategy = "fit" | "fill" | "stretch" | "none";

export interface ImageScaleInput {
  configWidth: number | null;
  configHeight: number | null;
  naturalWidth: number;
  naturalHeight: number;
  strategy: ImageScaleStrategy;
}

/**
 * Calculate image scale based on configured dimensions and strategy.
 * Returns { scaleX, scaleY }.
 *
 * Strategies:
 * - 'fit': Scale to fit inside bounds, maintain aspect ratio (uses Math.min)
 * - 'fill': Scale to fill bounds, maintain aspect ratio (uses Math.max)
 * - 'stretch': Scale to exact dimensions, ignore aspect ratio
 * - 'none': No scaling, return { scaleX: 1, scaleY: 1 }
 */
export function calculateImageScale(input: ImageScaleInput): ScaleConfig {
  const { configWidth, configHeight, naturalWidth, naturalHeight, strategy } =
    input;

  switch (strategy) {
    case "fit":
      return calculateFitScale(
        configWidth,
        configHeight,
        naturalWidth,
        naturalHeight,
      );
    case "fill":
      return calculateFillScale(
        configWidth,
        configHeight,
        naturalWidth,
        naturalHeight,
      );
    case "stretch":
      return calculateStretchScale(
        configWidth,
        configHeight,
        naturalWidth,
        naturalHeight,
      );
    case "none":
      return 1;
  }
}

/**
 * Fit: Scale to fit inside bounds, maintain aspect ratio.
 * Uses the smaller of the two scale factors.
 */
function calculateFitScale(
  configWidth: number | null,
  configHeight: number | null,
  naturalWidth: number,
  naturalHeight: number,
): ScaleConfig {
  if (configWidth === null && configHeight === null) {
    logger.warn(
      "[calculateFitScale] No dimensions provided, defaulting to scale 1",
    );
    return 1;
  }

  // Both specified - fit to bounds maintaining aspect ratio
  if (configWidth !== null && configHeight !== null) {
    const widthScale = configWidth / naturalWidth;
    const heightScale = configHeight / naturalHeight;
    const fitScale = Math.min(widthScale, heightScale);
    return fitScale;
  }

  // Only width specified - scale proportionally
  if (configWidth !== null) {
    const widthScale = configWidth / naturalWidth;
    return widthScale;
  }

  // Only height specified - scale proportionally
  const heightScale = configHeight! / naturalHeight;
  return heightScale;
}

/**
 * Fill: Scale to fill bounds completely, maintain aspect ratio.
 * Uses the larger of the two scale factors.
 */
function calculateFillScale(
  configWidth: number | null,
  configHeight: number | null,
  naturalWidth: number,
  naturalHeight: number,
): ScaleConfig {
  if (configWidth === null && configHeight === null) {
    logger.warn(
      "[calculateFillScale] No dimensions provided, defaulting to scale 1",
    );
    return 1;
  }

  // Both specified - fill bounds maintaining aspect ratio
  if (configWidth !== null && configHeight !== null) {
    const widthScale = configWidth / naturalWidth;
    const heightScale = configHeight / naturalHeight;
    const fillScale = Math.max(widthScale, heightScale);
    return fillScale;
  }

  // Only width specified - scale proportionally (same as fit for single dimension)
  if (configWidth !== null) {
    const widthScale = configWidth / naturalWidth;
    return widthScale;
  }

  // Only height specified - scale proportionally (same as fit for single dimension)
  const heightScale = configHeight! / naturalHeight;
  return heightScale;
}

/**
 * Stretch: Scale to exact dimensions, ignore aspect ratio.
 * Sets scaleX and scaleY independently.
 * Assumes both configWidth and configHeight are provided (validated externally).
 */
function calculateStretchScale(
  configWidth: number | null,
  configHeight: number | null,
  naturalWidth: number,
  naturalHeight: number,
): ScaleConfig {
  if (configWidth === null || configHeight === null) {
    logger.warn(
      "[calculateStretchScale] No dimensions provided, defaulting to scale 1",
    );
    return 1;
  }

  const scaleX = configWidth / naturalWidth;
  const scaleY = configHeight / naturalHeight;
  return { x: scaleX, y: scaleY };
}
