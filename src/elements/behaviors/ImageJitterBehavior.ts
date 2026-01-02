import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

interface ImageJitterConfig {
  jitterAmount?: number;
}

export class ImageJitterBehavior extends Element {
  private jitterAmount: number;
  private baseX = 0;
  private baseY = 0;

  constructor(config: ImageJitterConfig = {}) {
    super();
    this.jitterAmount = config.jitterAmount ?? 6;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  override play(): void {
    super.play();
    const target = this.target;
    if (!target) {
      return;
    }

    this.baseX = target.x;
    this.baseY = target.y;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const target = this.target;
    if (!target) {
      return;
    }

    target.x = this.baseX + (Math.random() - 0.5) * this.jitterAmount * 2;
    target.y = this.baseY + (Math.random() - 0.5) * this.jitterAmount * 2;
  }
}
