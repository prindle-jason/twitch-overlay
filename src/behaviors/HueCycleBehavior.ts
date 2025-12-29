import { Behavior } from "./Behavior";
import { TransformElement } from "../elements/TransformElement";

interface HueCycleConfig {
  hueIncrement?: number;
}

export class HueCycleBehavior extends Behavior {
  private hueIncrement: number;
  private hue: number;

  constructor(config: HueCycleConfig = {}) {
    super();
    this.hueIncrement = config.hueIncrement ?? 0.5;
    this.hue = Math.random() * 360;
  }

  onPlay(element: TransformElement): void {
    this.hue = Math.random() * 360;
  }

  update(element: TransformElement, deltaTime: number): void {
    const speedScale = deltaTime / 16.67;
    this.hue = (this.hue + this.hueIncrement * speedScale) % 360;
    element.filter = `hue-rotate(${this.hue}deg)`;
  }
}
