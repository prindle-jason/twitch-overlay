import { Element } from "../Element";
import { ImageElement } from "../ImageElement";
import { applyTiming, TimingCurve } from "../../utils/timing";

export class ImageFadeInOutBehavior extends Element {
  private fadeTime: number;

  constructor(fadeTime: number = 0.25) {
    super();
    this.fadeTime = fadeTime;
  }

  private get target(): ImageElement | null {
    return this.parent instanceof ImageElement ? this.parent : null;
  }

  private apply(): void {
    if (this.target) {
      this.target.opacity = applyTiming(
        this.target.getProgress(),
        TimingCurve.FADE_IN_OUT,
        this.fadeTime
      );
    }
  }

  override play(): void {
    super.play();
    this.apply();
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    this.apply();
  }
}
