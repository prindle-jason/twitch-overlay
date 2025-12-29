import { Behavior } from "./Behavior";
import { TransformElement } from "../elements/TransformElement";

interface ScreenBounceConfig {
  screenWidth: number;
  screenHeight: number;
  velocityX?: number;
  velocityY?: number;
}

export class ScreenBounceBehavior extends Behavior {
  private screenWidth: number;
  private screenHeight: number;
  private velocityX: number;
  private velocityY: number;

  constructor(config: ScreenBounceConfig) {
    super();
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.velocityX = config.velocityX ?? 2;
    this.velocityY = config.velocityY ?? 2;
  }

  update(element: TransformElement, deltaTime: number): void {
    const speedScale = deltaTime / 16.67;

    element.x += this.velocityX * speedScale;
    element.y += this.velocityY * speedScale;

    const width = element.getWidth();
    const height = element.getHeight();

    if (element.x < 0) {
      element.x = 0;
      this.velocityX = Math.abs(this.velocityX);
    } else if (element.x + width > this.screenWidth) {
      element.x = this.screenWidth - width;
      this.velocityX = -Math.abs(this.velocityX);
    }

    if (element.y < 0) {
      element.y = 0;
      this.velocityY = Math.abs(this.velocityY);
    } else if (element.y + height > this.screenHeight) {
      element.y = this.screenHeight - height;
      this.velocityY = -Math.abs(this.velocityY);
    }
  }
}
