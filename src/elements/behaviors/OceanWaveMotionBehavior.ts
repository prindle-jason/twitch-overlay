import { Element } from "../primitives/Element";
import { TransformElement } from "../primitives/TransformElement";

interface OceanWaveMotionConfig {
  amplitudePx: number;
  wavelengthPx: number;
  phaseOffsetPx?: number;
  rollAmountPx?: number;
  crestSharpness?: number;
}

/**
 * Adds a rolling ocean-like offset to a moving TransformElement.
 * Designed to be combined with TranslateBehavior so base horizontal motion
 * remains deterministic while this adds x/y wave offsets.
 */
export class OceanWaveMotionBehavior extends Element {
  private readonly amplitudePx: number;
  private readonly wavelengthPx: number;
  private readonly phaseOffsetPx: number;
  private readonly rollAmountPx: number;
  private readonly crestSharpness: number;

  constructor(config: OceanWaveMotionConfig) {
    super();
    this.amplitudePx = Math.max(0, config.amplitudePx);
    this.wavelengthPx = Math.max(1, config.wavelengthPx);
    this.phaseOffsetPx = config.phaseOffsetPx ?? 0;
    this.rollAmountPx = Math.max(0, config.rollAmountPx ?? 0);
    this.crestSharpness = Math.max(0, Math.min(1, config.crestSharpness ?? 0));
  }

  private get target(): TransformElement | null {
    return this.parent instanceof TransformElement ? this.parent : null;
  }

  protected override updateSelf(_deltaTime: number): void {
    const target = this.target;
    if (!target) {
      return;
    }

    const theta =
      ((target.x + this.phaseOffsetPx) / this.wavelengthPx) * Math.PI * 2;
    const primary = Math.sin(theta);
    const secondary = Math.sin(theta * 2 - Math.PI / 3) * this.crestSharpness;

    target.x += Math.cos(theta - Math.PI / 2) * this.rollAmountPx;
    target.y += (primary + secondary) * this.amplitudePx;
  }
}
