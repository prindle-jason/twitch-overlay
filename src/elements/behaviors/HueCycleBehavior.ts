import { Element } from "../primitives/Element";
import { TransformElement } from "../primitives/TransformElement";

interface HueCycleConfig {
  hueIncrement?: number;
}

export class HueCycleBehavior extends Element {
  private hueIncrement: number;
  private hue: number;

  constructor(config: HueCycleConfig = {}) {
    super();
    this.hueIncrement = config.hueIncrement ?? 0.03;
    this.hue = Math.random() * 360;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  protected override updateSelf(deltaTime: number): void {
    if (this.target) {
      this.hue = this.hue + this.hueIncrement * deltaTime;
      this.hue = this.hue % 360;
      this.target.filter = `hue-rotate(${this.hue}deg)`;
    }
  }
}
