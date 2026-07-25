export interface Position {
  x: number;
  y: number;
}

export type Alignment =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type InsetConfig =
  | number
  | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };

export interface PositionOffset {
  x?: number;
  y?: number;
}

export interface ElementPosition {
  align: Alignment;
  inset?: InsetConfig;
  offset?: PositionOffset;
}

function normalizeInsets(inset?: InsetConfig): Insets {
  if (typeof inset === "number") {
    return {
      top: inset,
      right: inset,
      bottom: inset,
      left: inset,
    };
  }

  return {
    top: inset?.top ?? 0,
    right: inset?.right ?? 0,
    bottom: inset?.bottom ?? 0,
    left: inset?.left ?? 0,
  };
}

export function resolveElementPosition(
  position: ElementPosition,
  width: number,
  height: number,
  canvasW: number,
  canvasH: number,
): Position {
  const inset = normalizeInsets(position.inset);
  const offsetX = position.offset?.x ?? 0;
  const offsetY = position.offset?.y ?? 0;

  const centeredX = (canvasW - width) / 2;
  const centeredY = (canvasH - height) / 2;

  switch (position.align) {
    case "top-left":
      return { x: inset.left + offsetX, y: inset.top + offsetY };

    case "top":
      return { x: centeredX + offsetX, y: inset.top + offsetY };

    case "top-right":
      return {
        x: canvasW - width - inset.right + offsetX,
        y: inset.top + offsetY,
      };

    case "left":
      return { x: inset.left + offsetX, y: centeredY + offsetY };

    case "center":
      return { x: centeredX + offsetX, y: centeredY + offsetY };

    case "right":
      return {
        x: canvasW - width - inset.right + offsetX,
        y: centeredY + offsetY,
      };

    case "bottom-left":
      return {
        x: inset.left + offsetX,
        y: canvasH - height - inset.bottom + offsetY,
      };

    case "bottom":
      return {
        x: centeredX + offsetX,
        y: canvasH - height - inset.bottom + offsetY,
      };

    case "bottom-right":
      return {
        x: canvasW - width - inset.right + offsetX,
        y: canvasH - height - inset.bottom + offsetY,
      };
  }
}
