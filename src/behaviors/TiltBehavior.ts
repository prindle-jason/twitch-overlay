import { Behavior } from "./Behavior";
import { TransformElement } from "../elements/TransformElement";

interface TiltConfig {
  rotationSpeed?: number; // radians per second
  wobbleAmount?: number;
  wobbleSpeed?: number;
}

export class TiltBehavior extends Behavior {
  private rotationSpeed: number;
  private wobbleAmount: number;
  private wobbleSpeed: number;
  private wobbleOffset: number;

  constructor(config: TiltConfig = {}) {
    super();
    this.rotationSpeed = config.rotationSpeed ?? 1;
    this.wobbleAmount = config.wobbleAmount ?? 0;
    this.wobbleSpeed = config.wobbleSpeed ?? 2;
    this.wobbleOffset = Math.random() * Math.PI * 2;
  }

  update(element: TransformElement, deltaTime: number): void {
    const dt = deltaTime / 1000;

    element.rotation += this.rotationSpeed * dt;

    if (this.wobbleAmount > 0) {
      const wobble =
        Math.sin((Date.now() / 1000) * this.wobbleSpeed + this.wobbleOffset) *
        this.wobbleAmount;
      element.rotation += wobble * dt;
    }

    const twoPi = Math.PI * 2;
    while (element.rotation > twoPi) element.rotation -= twoPi;
    while (element.rotation < 0) element.rotation += twoPi;
  }
}
