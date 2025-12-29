import { Behavior } from "./Behavior";
import { TransformElement } from "../elements/TransformElement";

interface CornerDetectionConfig {
  screenWidth: number;
  screenHeight: number;
  epsilon?: number;
}

export class ScreenCornerDetectionBehavior extends Behavior {
  private screenWidth: number;
  private screenHeight: number;
  private epsilon: number;
  cornerReached = false;

  constructor(config: CornerDetectionConfig) {
    super();
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.epsilon = config.epsilon ?? 2;
  }

  update(element: TransformElement, deltaTime: number): void {
    if (this.cornerReached) return;

    const x = element.x;
    const y = element.y;
    const width = element.getWidth();
    const height = element.getHeight();

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
    }
  }
}
