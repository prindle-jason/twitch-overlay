import { Element } from "../Element";
import { ImageElement } from "../ImageElement";
import { applyTiming, TimingCurve } from "../../utils/timing";

interface FadeInOutConfig {
  fadeTime?: number;
}

export class FadeInOutBehavior extends Element {
  private fadeTime: number;

  constructor(config: FadeInOutConfig = {}) {
    super();
    this.fadeTime = config.fadeTime ?? 0.25;
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
