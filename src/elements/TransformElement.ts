import { Element } from "./Element";

export abstract class TransformElement extends Element {
  x = 0;
  y = 0;
  opacity = 1;
  scaleX = 1;
  scaleY = 1;
  rotation = 0;
  filter = "none";
  private width: number | null = null;
  private height: number | null = null;

  getWidth(): number | null {
    return this.width;
  }

  getHeight(): number | null {
    return this.height;
  }

  setScale(scale: number) {
    this.scaleX = scale;
    this.scaleY = scale;
  }

  setWidth(width: number | null) {
    this.width = width;
  }

  setHeight(height: number | null) {
    this.height = height;
  }

  /**
   * Applies transforms, renders self, then renders children.
   * Subclasses should override drawSelf() for custom drawing; they can override draw() to change ordering.
   */
  draw(ctx: CanvasRenderingContext2D): void {
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
  protected drawSelf(ctx: CanvasRenderingContext2D): void {
    // Default: no-op; subclasses decide what to render
  }

  /**
   * Helper for subclasses that want to render all children.
   */
  protected drawChildren(ctx: CanvasRenderingContext2D): void {
    this.children
      .filter((child) => child.getState() === "PLAYING")
      .forEach((child) => child.draw(ctx));
  }
}
