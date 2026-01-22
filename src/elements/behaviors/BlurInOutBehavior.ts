import { Element } from "../primitives/Element";
import { applyTiming, TimingCurve } from "../../utils/timing/TimingCurves";
import { TransformElement } from "../primitives/TransformElement";

interface BlurInOutConfig {
  maxBlur?: number;
  fadeTime?: number;
}

export class BlurInOutBehavior extends Element {
  private maxBlur: number;
  private fadeTime: number;

  constructor(config: BlurInOutConfig = {}) {
    super();
    this.maxBlur = config.maxBlur ?? 16;
    this.fadeTime = config.fadeTime ?? 0.4;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  private apply(): void {
    if (this.target) {
      const alpha = applyTiming(
        this.target.getProgress(),
        TimingCurve.EASE_IN_OUT_QUAD,
      );
      const blurPx = this.maxBlur * (1 - alpha);
      this.target.filter = `blur(${blurPx}px)`;
    }
  }

  override play(): void {
    super.play();
    this.apply();
  }

  protected override updateSelf(deltaTime: number): void {
    this.apply();
  }
}
