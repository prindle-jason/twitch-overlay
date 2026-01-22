import { Element } from "../primitives/Element";
import { TransformElement } from "../primitives/TransformElement";

interface TiltConfig {
  rotationSpeed?: number; // radians per second
  wobbleAmount?: number;
  wobbleSpeed?: number;
}

export class TiltBehavior extends Element {
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

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  protected override updateSelf(deltaTime: number): void {
    const target = this.target;
    if (!target) {
      return;
    }

    const dt = deltaTime / 1000;

    target.rotation += this.rotationSpeed * dt;

    if (this.wobbleAmount > 0) {
      const wobble =
        Math.sin((Date.now() / 1000) * this.wobbleSpeed + this.wobbleOffset) *
        this.wobbleAmount;
      target.rotation += wobble * dt;
    }

    const twoPi = Math.PI * 2;
    while (target.rotation > twoPi) target.rotation -= twoPi;
    while (target.rotation < 0) target.rotation += twoPi;
  }
}
