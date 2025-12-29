import { Behavior } from "./Behavior";
import type { Element } from "../elements/Element";
import { TransformElement } from "../elements/TransformElement";

interface FallingConfig {
  velocityY?: number;
  gravity?: number;
  velocityX?: number;
  drag?: number; // 0-1
}

export class FallingBehavior extends Behavior {
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

  update(element: TransformElement, deltaTime: number): void {
    const dt = deltaTime / 1000;

    this.velocityY += this.gravity * dt;

    if (this.drag > 0) {
      const factor = Math.pow(1 - this.drag, dt);
      this.velocityX *= factor;
      this.velocityY *= factor;
    }

    element.x += this.velocityX * dt;
    element.y += this.velocityY * dt;
  }
}
