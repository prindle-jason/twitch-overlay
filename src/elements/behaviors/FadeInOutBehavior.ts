import { Element, ElementConfig } from "../primitives/Element";
import { applyTiming, TimingCurve } from "../../utils/timing/TimingCurves";
import { TransformElement } from "../primitives/TransformElement";
import { logger } from "../../utils/logger";

interface PercentageFadeConfig extends ElementConfig {
  fadeMode?: "percentage";
  fadeTime?: number;
  timingCurve?: TimingCurve;
}

interface AbsoluteFadeConfig extends ElementConfig {
  fadeMode: "absolute";
  fadeMs: number;
  duration: number;
  timingCurve?: TimingCurve;
}

type FadeInOutConfig = PercentageFadeConfig | AbsoluteFadeConfig;

export class FadeInOutBehavior extends Element {
  private fadeTime: number;
  private timingCurve: TimingCurve;

  constructor(config: FadeInOutConfig = { fadeMode: "percentage" }) {
    super(config);

    this.timingCurve = config.timingCurve ?? TimingCurve.FADE_IN_OUT;

    if (config.fadeMode === "absolute") {
      this.fadeTime = config.fadeMs / config.duration;
      logger.debug("FadeInOutBehavior [absolute]", {
        fadeMs: config.fadeMs,
        duration: config.duration,
        fadeTime: this.fadeTime,
      });
    } else {
      this.fadeTime = config.fadeTime ?? 0.25;
      logger.debug("FadeInOutBehavior [percentage]", {
        fadeTime: this.fadeTime,
      });
    }
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  private apply(): void {
    if (this.target) {
      const opacity = applyTiming(
        this.getProgress(),
        this.timingCurve,
        this.fadeTime,
      );
      this.target.opacity = opacity;
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
