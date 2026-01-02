import { Element } from "../Element";
import { TransformElement } from "../TransformElement";
import { applyTiming, TimingCurve } from "../../utils/timing";

interface TranslateConfig {
  duration?: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  fadeTime?: number;
  timingFunction?: TimingCurve;
}

/* Will translate an element from a start position to an end position
 * over the duration of the parent element,
 * or over the specified duration if provided.
 */
export class TranslateBehavior extends Element {
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private fadeTime: number;
  private timingFunction: TimingCurve;

  constructor(config: TranslateConfig) {
    super();
    if (config.duration) {
      this.duration = config.duration;
    }
    this.startX = config.startX;
    this.startY = config.startY;
    this.endX = config.endX;
    this.endY = config.endY;
    this.fadeTime = config.fadeTime ?? 0.2;
    this.timingFunction = config.timingFunction ?? TimingCurve.FADE_IN_OUT;
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  override play(): void {
    super.play();
    const target = this.target;
    if (!target) {
      return;
    }

    target.x = this.startX;
    target.y = this.startY;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    const target = this.target;
    if (target) {
      const t = applyTiming(
        this.getProgress(),
        this.timingFunction,
        this.fadeTime
      );
      target.x = this.startX + (this.endX - this.startX) * t;
      target.y = this.startY + (this.endY - this.startY) * t;
    }
  }
}
