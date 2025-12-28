import { Behavior } from "./Behavior";

export class ImageScaleBehavior extends Behavior {
  scaleX: number;
  scaleY: number;

  constructor(config: { scaleX?: number; scaleY?: number } = {}) {
    super(config);
    this.scaleX = config.scaleX ?? 1;
    this.scaleY = config.scaleY ?? config.scaleX ?? 1;
  }

  onPlay(element: any) {
    element.scaleX = this.scaleX;
    element.scaleY = this.scaleY;
  }
}
