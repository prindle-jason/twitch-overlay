import { Behavior } from "./Behavior";
import { TransformElement } from "../elements/TransformElement";

interface ImageJitterConfig {
  jitterAmount?: number;
}

export class ImageJitterBehavior extends Behavior {
  private jitterAmount: number;
  private baseX = 0;
  private baseY = 0;

  constructor(config: ImageJitterConfig = {}) {
    super();
    this.jitterAmount = config.jitterAmount ?? 6;
  }

  onPlay(element: TransformElement): void {
    this.baseX = element.x;
    this.baseY = element.y;
  }

  update(element: TransformElement, deltaTime: number): void {
    element.x = this.baseX + (Math.random() - 0.5) * this.jitterAmount * 2;
    element.y = this.baseY + (Math.random() - 0.5) * this.jitterAmount * 2;
  }
}
