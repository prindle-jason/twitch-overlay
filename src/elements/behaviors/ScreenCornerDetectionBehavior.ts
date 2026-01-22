import { Element } from "../primitives/Element";
import { TransformElement } from "../primitives/TransformElement";

interface CornerDetectionConfig {
  screenWidth: number;
  screenHeight: number;
  epsilon?: number;
  onCornerReached?: () => void;
}

export class ScreenCornerDetectionBehavior extends Element {
  private screenWidth: number;
  private screenHeight: number;
  private epsilon: number;
  private onCornerReached?: () => void;
  cornerReached = false;

  constructor(config: CornerDetectionConfig) {
    super();
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.epsilon = config.epsilon ?? 2;
    this.onCornerReached = config.onCornerReached;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  protected override updateSelf(deltaTime: number): void {
    const target = this.target;

    if (target && !this.cornerReached) {
      const x = target.x;
      const y = target.y;
      const width = target.getWidth() ?? 0;
      const height = target.getHeight() ?? 0;

      const atLeft = x <= this.epsilon;
      const atRight = x + width >= this.screenWidth - this.epsilon;
      const atTop = y <= this.epsilon;
      const atBottom = y + height >= this.screenHeight - this.epsilon;

      const isInCorner =
        (atLeft && atTop) ||
        (atRight && atTop) ||
        (atLeft && atBottom) ||
        (atRight && atBottom);

      if (isInCorner) {
        this.cornerReached = true;
        this.onCornerReached?.();
      }
    }
  }
}
