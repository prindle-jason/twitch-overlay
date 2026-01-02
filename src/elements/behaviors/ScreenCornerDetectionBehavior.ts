import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

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

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const target = this.target;

    if (target && !this.cornerReached) {
      const x = target.x;
      const y = target.y;
      const width = target.getWidth();
      const height = target.getHeight();

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
