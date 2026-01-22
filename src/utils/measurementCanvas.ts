/**
 * Reusable canvas for measurement operations to avoid creating multiple DOM elements.
 */
let measurementCanvas: HTMLCanvasElement | null = null;

/**
 * Gets a shared 2D canvas context for text measurement and other non-rendering operations.
 * Reuses the same canvas to avoid creating multiple DOM elements.
 */
function getMeasurementContext(): CanvasRenderingContext2D {
  if (!measurementCanvas) {
    measurementCanvas = document.createElement("canvas");
  }
  return measurementCanvas.getContext("2d")!;
}

/**
 * Measures the width of text with the specified font.
 * Uses a shared canvas context and manages its state internally.
 *
 * @param text The text to measure
 * @param font The font string (e.g., "normal 24px Arial")
 * @returns The width of the text in pixels
 */
export function measureText(text: string, font: string): number {
  const ctx = getMeasurementContext();
  ctx.font = font;
  return ctx.measureText(text).width;
}
