import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

interface JitterConfig {
  jitterAmount?: number;
}

/* Jitter around a fixed position */
export class JitterBehavior extends Element {
  private jitterAmount: number;
  private baseX = 0;
  private baseY = 0;

  constructor(config: JitterConfig = {}) {
    super();
    this.jitterAmount = config.jitterAmount ?? 6;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  override play(): void {
    super.play();

    if (this.target) {
      this.baseX = this.target.x;
      this.baseY = this.target.y;
    }
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.target) {
      this.target.x =
        this.baseX + (Math.random() - 0.5) * this.jitterAmount * 2;
      this.target.y =
        this.baseY + (Math.random() - 0.5) * this.jitterAmount * 2;
    }
  }
}
