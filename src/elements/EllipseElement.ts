import { TransformElement } from "./TransformElement";

interface EllipseConfig {
  x?: number;
  y?: number;
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  color?: string;
  opacity?: number;
}

export class EllipseElement extends TransformElement {
  radiusX: number;
  radiusY: number;
  color: string;

  constructor(config: EllipseConfig = {}) {
    super();
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.radiusX = config.radiusX ?? 10;
    this.radiusY = config.radiusY ?? this.radiusX;
    this.rotation = config.rotation ?? 0;
    this.color = config.color ?? "#ffffff";
    this.opacity = config.opacity ?? 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.ellipse(
      this.x,
      this.y,
      this.radiusX,
      this.radiusY,
      this.rotation,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  isOffScreen(screenWidth: number, screenHeight: number): boolean {
    const margin = Math.max(this.radiusX, this.radiusY) + 10;
    return (
      this.x < -margin ||
      this.x > screenWidth + margin ||
      this.y < -margin ||
      this.y > screenHeight + margin
    );
  }
}
