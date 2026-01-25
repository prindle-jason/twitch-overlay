export type CornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface Position {
  x: number;
  y: number;
}

/**
 * Calculate position for an element anchored to a corner of the canvas.
 * @param corner - Which corner to anchor to
 * @param width - Width of the element
 * @param height - Height of the element
 * @param canvasW - Canvas width
 * @param canvasH - Canvas height
 * @param padding - Distance from edge in pixels
 */
export function positionCorner(
  corner: CornerPosition,
  width: number,
  height: number,
  canvasW: number,
  canvasH: number,
  padding = 20,
): Position {
  const positions: Record<CornerPosition, Position> = {
    'bottom-right': { x: canvasW - width - padding, y: canvasH - height - padding },
    'bottom-left': { x: padding, y: canvasH - height - padding },
    'top-right': { x: canvasW - width - padding, y: padding },
    'top-left': { x: padding, y: padding },
  };
  return positions[corner];
}
