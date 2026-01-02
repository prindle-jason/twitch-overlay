import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

interface FallingConfig {
  velocityY?: number;
  gravity?: number;
  velocityX?: number;
  drag?: number; // 0-1
}

export class FallingBehavior extends Element {
  private velocityY: number;
  private gravity: number;
  private velocityX: number;
  private drag: number;

  constructor(config: FallingConfig = {}) {
    super();
    this.velocityY = config.velocityY ?? 0;
    this.gravity = config.gravity ?? 200;
    this.velocityX = config.velocityX ?? 0;
    this.drag = config.drag ?? 0;
  }

  override update(deltaTime: number): void {
    if (!(this.parent instanceof TransformElement)) {
      return;
    }

    const dt = deltaTime / 1000;

    this.velocityY += this.gravity * dt;

    if (this.drag > 0) {
      const factor = Math.pow(1 - this.drag, dt);
      this.velocityX *= factor;
      this.velocityY *= factor;
    }

    this.parent.x += this.velocityX * dt;
    this.parent.y += this.velocityY * dt;

    super.update(deltaTime);
  }
}
