import { TransformElement } from "../primitives/TransformElement";

export interface StarParticleConfig {
  x: number;
  y: number;
  radius: number;
  duration: number;
  color?: string;
}

export class StarParticleElement extends TransformElement {
  private radius: number;
  private innerRadius: number;
  private points = 5;
  private color: string;

  constructor(config: StarParticleConfig) {
    super({ x: config.x, y: config.y, duration: config.duration });
    this.radius = config.radius;
    this.innerRadius = config.radius * 0.45;
    this.color = config.color ?? "#fff2a8";
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    // Draw around local (0,0) so rotation stays centered on the star.
    let angle = -Math.PI / 2;
    const step = Math.PI / this.points;

    ctx.beginPath();
    for (let i = 0; i < this.points * 2; i++) {
      const r = i % 2 === 0 ? this.radius : this.innerRadius;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
      angle += step;
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
