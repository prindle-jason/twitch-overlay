import { ScaleConfig } from "../../utils/dimensions";
import { Element, ElementConfig } from "./Element";

export interface TransformElementConfig extends ElementConfig {
  x?: number;
  y?: number;
  opacity?: number;
  scale?: ScaleConfig;
  rotation?: number;
  filter?: string;
  width?: number | null;
  height?: number | null;
}

export abstract class TransformElement extends Element {
  x!: number;
  y!: number;
  opacity!: number;
  scaleX!: number;
  scaleY!: number;
  rotation!: number;
  filter!: string;
  private width: number | null = null;
  private height: number | null = null;

  constructor(config: TransformElementConfig = {}) {
    super(config);

    // Handle scale
    this.setScale(config.scale ?? 1);

    // Apply remaining properties
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.opacity = config.opacity ?? 1;
    this.rotation = config.rotation ?? 0;
    this.filter = config.filter ?? "none";
    this.setWidth(config.width ?? null);
    this.setHeight(config.height ?? null);
  }

  getWidth(): number | null {
    return this.width;
  }

  getHeight(): number | null {
    return this.height;
  }

  setScale(scale: ScaleConfig): void {
    if (typeof scale === "number") {
      this.scaleX = scale;
      this.scaleY = scale;
    } else {
      if (scale.x !== undefined) this.scaleX = scale.x;
      if (scale.y !== undefined) this.scaleY = scale.y;
    }
  }

  setWidth(width: number | null) {
    this.width = width;
  }

  setHeight(height: number | null) {
    this.height = height;
  }

  /**
   * Applies transforms, renders self, then renders children.
   * Fully overrides draw() to keep transform context wrapping both drawSelf and drawChildren.
   */
  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;

    ctx.save();

    ctx.filter = this.filter;
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    // Modify opacity to be multiplicative
    ctx.globalAlpha *= this.opacity;

    this.drawSelf(ctx);
    this.drawChildren(ctx);
    ctx.restore();
  }

  /**
   * Override this method to provide custom rendering logic.
   * The context is already transformed with position, rotation, scale, opacity, and filter.
   */
  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    // Default: no-op; subclasses decide what to render
  }
}
