import { TransformElement } from "./TransformElement";

interface BoxConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  duration?: number;
}

export class BoxElement extends TransformElement {
  color: string;

  constructor(config: BoxConfig = {}) {
    super();
    this.x = config.x ?? 0;
    this.y = config.y ?? 0;
    this.setWidth(config.width ?? 10);
    this.setHeight(config.height ?? 10);
    this.color = config.color ?? "#ffffff";
    this.duration = config.duration ?? -1;
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.getWidth()!, this.getHeight()!);
  }
}
