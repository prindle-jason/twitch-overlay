import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

interface FallingConfig {
  gravity?: number;
  velocityY?: number;
  velocityX?: number;
  drag?: number; // 0-1
}

export class TransformGravityBehavior extends Element {
  private gravity: number;
  private velocityY: number;
  private velocityX: number;
  private drag: number;

  constructor(config: FallingConfig = {}) {
    super();
    this.gravity = config.gravity ?? 200;
    this.velocityY = config.velocityY ?? 0;
    this.velocityX = config.velocityX ?? 0;
    this.drag = config.drag ?? 0;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
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
  }
}
