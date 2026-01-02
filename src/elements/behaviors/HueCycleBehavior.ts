import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

interface HueCycleConfig {
  hueIncrement?: number;
}

export class HueCycleBehavior extends Element {
  private hueIncrement: number;
  private hue: number;

  constructor(config: HueCycleConfig = {}) {
    super();
    this.hueIncrement = config.hueIncrement ?? 0.5;
    this.hue = Math.random() * 360;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  override play(): void {
    super.play();
    this.hue = Math.random() * 360;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const target = this.target;
    if (!target) {
      return;
    }

    const speedScale = deltaTime / 16.67;
    this.hue = (this.hue + this.hueIncrement * speedScale) % 360;
    target.filter = `hue-rotate(${this.hue}deg)`;
  }
}
