import { Behavior } from "./Behavior";
import { getEaseInOutProgress } from "../utils/progressUtils";

export class SlideBehavior extends Behavior {
  startX = 0;
  startY = 0;
  endX = 0;
  endY = 0;
  fadeTime = 0.2;

  constructor(
    config: {
      startX?: number;
      startY?: number;
      endX?: number;
      endY?: number;
      fadeTime?: number;
    } = {}
  ) {
    super(config);
    this.startX = config.startX ?? 0;
    this.startY = config.startY ?? 0;
    this.endX = config.endX ?? 0;
    this.endY = config.endY ?? 0;
    this.fadeTime = config.fadeTime ?? 0.2;
  }

  onPlay(element: any) {
    element.x = this.startX;
    element.y = this.startY;
  }

  update(element: any, deltaTime: number) {
    const progress = element.effect.getProgress();
    const slide = 1 - getEaseInOutProgress(progress, this.fadeTime);
    element.x = this.startX + (this.endX - this.startX) * (1 - slide);
    element.y = this.startY + (this.endY - this.startY) * (1 - slide);
  }
}
