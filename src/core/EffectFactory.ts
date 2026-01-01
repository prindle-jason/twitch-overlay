import { ConfettiEffect } from "../effects/ConfettiEffect";
import { XJasonEffect } from "../effects/XJasonEffect";
import { TickerEffect } from "../effects/TickerEffect";
import { WatermarkEffect } from "../effects/WatermarkEffect";
import { ConvergingSlideEffect } from "../effects/ConvergingSlideEffect";
import { CenteredImageEffect } from "../effects/CenteredImageEffect";
import { HeadbladeEffect } from "../effects/HeadbladeEffect";
import { Effect } from "../effects/Effect";
import { pickRandom } from "../utils/random";

type FactoryFn = (opts: Record<string, unknown>) => Effect;

export class EffectFactory {
  private factories: Record<string, FactoryFn>;
  private effectIdCounter = 0;

  constructor() {
    this.factories = {
      confetti: () => new ConfettiEffect(),
      xJason: () => new XJasonEffect(),
      ticker: (opts) => new TickerEffect(opts as any),
      ssbmFail: () => CenteredImageEffect.createSsbmFail(),
      ssbmSuccess: () => CenteredImageEffect.createSsbmSuccess(),
      bamSuccess: () => ConvergingSlideEffect.createBamSuccess(),
      bamUhOh: () => ConvergingSlideEffect.createBamFailure(),
      headblade: () => new HeadbladeEffect(),
      watermark: () => new WatermarkEffect(),

      success: (opts) => {
        const effects = ["ssbmSuccess", "bamSuccess"];
        const choice = pickRandom(effects);
        return this.factories[choice](opts);
      },
      failure: (opts) => {
        const effects = ["ssbmFail", "bamUhOh"];
        const choice = pickRandom(effects);
        return this.factories[choice](opts);
      },
    };
  }

  create(type: string, opts?: Record<string, unknown>): Effect | null {
    if (!type || !this.factories[type]) return null;
    const effect = this.factories[type]({
      ...(opts as any),
      id: ++this.effectIdCounter,
    });
    return effect;
  }
}
