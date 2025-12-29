import { Behavior } from "./Behavior";
import { getEaseInOutProgress } from "../utils/progressUtils";
import type { ImageElement } from "../elements/ImageElement";

export class ImageFadeInOutBehavior extends Behavior {
  private fadeTime: number;

  constructor(fadeTime: number = 0.25) {
    super();
    this.fadeTime = fadeTime;
  }

  private apply(element: ImageElement): void {
    const progress = element.getProgress();
    element.opacity = getEaseInOutProgress(progress, this.fadeTime);
  }

  onPlay(element: ImageElement): void {
    this.apply(element);
  }

  update(element: ImageElement, deltaTime: number): void {
    this.apply(element);
  }
}
