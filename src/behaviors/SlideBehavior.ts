import { Behavior } from "./Behavior";
import { getEaseInOutProgress } from "../utils/progressUtils";
import { TransformElement } from "../elements/TransformElement";

interface SlideConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  fadeTime?: number;
}

export class SlideBehavior extends Behavior {
  private startX;
  private startY;
  private endX;
  private endY;
  private fadeTime;

  constructor(config: SlideConfig) {
    super();
    this.startX = config.startX;
    this.startY = config.startY;
    this.endX = config.endX;
    this.endY = config.endY;
    this.fadeTime = config.fadeTime ?? 0.2;
  }

  onPlay(element: TransformElement) {
    //console.log("SlideBehavior onPlay", this.startX, this.startY);
    element.x = this.startX;
    element.y = this.startY;
  }

  update(element: TransformElement, deltaTime: number) {
    //console.log("SlideBehavior update", element.x, element.y);
    const progress = element.effect!.getProgress();
    const slide = 1 - getEaseInOutProgress(progress, this.fadeTime);
    element.x = this.startX + (this.endX - this.startX) * (1 - slide);
    element.y = this.startY + (this.endY - this.startY) * (1 - slide);
  }
}
