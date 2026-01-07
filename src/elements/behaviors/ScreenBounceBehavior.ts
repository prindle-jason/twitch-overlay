import { Element } from "../Element";
import { TransformElement } from "../TransformElement";

interface ScreenBounceConfig {
  screenWidth: number;
  screenHeight: number;
  velocityX?: number;
  velocityY?: number;
}

export class ScreenBounceBehavior extends Element {
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

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const target = this.target;
    if (!target) {
      return;
    }

    const speedScale = deltaTime / 16.67;

    target.x += this.velocityX * speedScale;
    target.y += this.velocityY * speedScale;

    const width = target.getWidth() ?? 0;
    const height = target.getHeight() ?? 0;

    if (target.x < 0) {
      target.x = 0;
      this.velocityX = Math.abs(this.velocityX);
    } else if (target.x + width > this.screenWidth) {
      target.x = this.screenWidth - width;
      this.velocityX = -Math.abs(this.velocityX);
    }

    if (target.y < 0) {
      target.y = 0;
      this.velocityY = Math.abs(this.velocityY);
    } else if (target.y + height > this.screenHeight) {
      target.y = this.screenHeight - height;
      this.velocityY = -Math.abs(this.velocityY);
    }
  }
}
