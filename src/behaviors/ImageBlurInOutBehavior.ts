import { Behavior } from "./Behavior";
import { ImageElement } from "../elements/ImageElement";
import { getEaseInOutProgress } from "../utils/progressUtils";

interface ImageBlurInOutConfig {
  maxBlur?: number;
  fadeTime?: number;
}

export class ImageBlurInOutBehavior extends Behavior {
  private maxBlur: number;
  private fadeTime: number;

  constructor(config: ImageBlurInOutConfig = {}) {
    super();
    this.maxBlur = config.maxBlur ?? 16;
    this.fadeTime = config.fadeTime ?? 0.4;
  }

  private apply(element: ImageElement): void {
    const progress = element.getProgress();
    const alpha = getEaseInOutProgress(progress, this.fadeTime);
    const blurPx = this.maxBlur * (1 - alpha);
    element.filter = `blur(${blurPx}px)`;
  }

  onPlay(element: ImageElement): void {
    this.apply(element);
  }

  update(element: ImageElement, deltaTime: number): void {
    this.apply(element);
  }
}
