import { DataElement, DataElementConfig } from "./DataElement";
import { ScaleConfig } from "../../utils/dimensions";
import { FilterComposer } from "../../utils/filters/FilterComposer";
import { logger } from "../../utils/logger";

export interface DataTransformElementConfig extends DataElementConfig {
  x?: number;
  y?: number;
  opacity?: number;
  scale?: ScaleConfig;
  rotation?: number;
  width?: number | null;
  height?: number | null;
}

/**
 * Data-driven transform element: base class for positioned, scaled, rotated elements.
 * Combines DataElement lifecycle with TransformElement rendering transforms.
 * Subclasses override drawSelf() to render within the transform context.
 */
export class DataTransformElement extends DataElement {
  protected x: number = 0;
  protected y: number = 0;
  protected opacity: number = 1;
  protected scaleX: number = 1;
  protected scaleY: number = 1;
  protected rotation: number = 0;
  protected filterComposer: FilterComposer = new FilterComposer();
  protected width: number | null = null;
  protected height: number | null = null;

  constructor(config?: Record<string, unknown> | DataTransformElementConfig) {
    super(config as DataElementConfig);

    const cfg = config as DataTransformElementConfig;
    this.x = cfg?.x ?? 0;
    this.y = cfg?.y ?? 0;
    this.opacity = cfg?.opacity ?? 1;
    this.rotation = cfg?.rotation ?? 0;
    this.width = cfg?.width ?? null;
    this.height = cfg?.height ?? null;

    this.setScale(cfg?.scale ?? 1);

    logger.warn("[DataTransform] Created", {
      position: { x: this.x, y: this.y },
      scale: { x: this.scaleX, y: this.scaleY },
      opacity: this.opacity,
      rotation: this.rotation,
      id: this.id,
    });
  }

  /**
   * Set scale from number or config object.
   * Mirrors TransformElement.setScale() for consistency.
   */
  setScale(scale: ScaleConfig): void {
    if (typeof scale === "number") {
      this.scaleX = scale;
      this.scaleY = scale;
    } else {
      if (scale.x !== undefined) this.scaleX = scale.x;
      if (scale.y !== undefined) this.scaleY = scale.y;
    }
  }

  /**
   * Applies transforms, renders self, then renders children.
   * Fully overrides draw() to keep transform context wrapping both drawSelf and drawChildren.
   * Matches TransformElement behavior while respecting DataElement hierarchy.
   */
  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;

    ctx.save();

    ctx.filter = this.filterComposer.getFilterString();
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    ctx.globalAlpha *= this.opacity;

    this.drawSelf(ctx);
    this.drawChildren(ctx);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------------
  getX(): number {
    return this.x;
  }

  setX(value: number): void {
    this.x = value;
  }

  getY(): number {
    return this.y;
  }

  setY(value: number): void {
    this.y = value;
  }

  getOpacity(): number {
    return this.opacity;
  }

  setOpacity(value: number): void {
    this.opacity = value;
  }

  getRotation(): number {
    return this.rotation;
  }

  setRotation(value: number): void {
    this.rotation = value;
  }

  getScaleX(): number {
    return this.scaleX;
  }

  getScaleY(): number {
    return this.scaleY;
  }

  getFilterComposer(): FilterComposer {
    return this.filterComposer;
  }

  getWidth(): number | null {
    return this.width;
  }

  setWidth(value: number | null): void {
    this.width = value;
  }

  getHeight(): number | null {
    return this.height;
  }

  setHeight(value: number | null): void {
    this.height = value;
  }
}
