import { Element } from "../Element";
import { ImageElement } from "../ImageElement";
import { applyTiming, TimingCurve } from "../../utils/timing";

interface ImageBlurInOutConfig {
  maxBlur?: number;
  fadeTime?: number;
}

export class ImageBlurInOutBehavior extends Element {
  private maxBlur: number;
  private fadeTime: number;

  constructor(config: ImageBlurInOutConfig = {}) {
    super();
    this.maxBlur = config.maxBlur ?? 16;
    this.fadeTime = config.fadeTime ?? 0.4;
  }

  private get target(): ImageElement | null {
    return this.parent instanceof ImageElement ? this.parent : null;
  }

  private apply(image: ImageElement): void {
    const progress = image.getProgress();
    const alpha = applyTiming(progress, TimingCurve.FADE_IN_OUT, this.fadeTime);
    const blurPx = this.maxBlur * (1 - alpha);
    image.filter = `blur(${blurPx}px)`;
  }

  override play(): void {
    super.play();
    const target = this.target;
    if (target) {
      this.apply(target);
    }
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const target = this.target;
    if (target) {
      this.apply(target);
    }
  }
}
