import { SceneElement } from "../elements/scenes/SceneElement";
import { CenteredImageScene } from "../elements/scenes/CenteredImageScene";
import { WatermarkScene } from "../elements/scenes/WatermarkScene";
import { ConfettiScene } from "../elements/scenes/ConfettiScene";
import { ConvergingSlideScene } from "../elements/scenes/ConvergingSlideScene";
import { HeadbladeScene } from "../elements/scenes/HeadbladeScene";
import { TickerScene } from "../elements/scenes/TickerScene";
import { XJasonScene } from "../elements/scenes/XJasonScene";
import { RichTextTestScene } from "../elements/scenes/RichTextTestScene";
import { pickRandom } from "../utils/random";

type SceneFactoryFn = (opts: Record<string, unknown>) => SceneElement;

/**
 * SceneFactory creates SceneElement instances.
 */
export class SceneFactory {
  private factories: Record<string, SceneFactoryFn>;

  constructor() {
    this.factories = {
      ssbmFail: () => CenteredImageScene.createSsbmFail(),
      ssbmSuccess: () => CenteredImageScene.createSsbmSuccess(),
      watermark: () => new WatermarkScene(),
      confetti: () => new ConfettiScene(),
      headblade: () => new HeadbladeScene(),
      ticker: (opts) => new TickerScene(opts as any),
      xJason: () => new XJasonScene(),
      bamSuccess: () => ConvergingSlideScene.createBamSuccess(),
      bamUhOh: () => ConvergingSlideScene.createBamFailure(),
      richTextTest: () => new RichTextTestScene(),

      success: (opts) => {
        const scenes = ["ssbmSuccess", "bamSuccess"];
        const choice = pickRandom(scenes);
        return this.factories[choice](opts);
      },
      failure: (opts) => {
        const scenes = ["ssbmFail", "bamUhOh"];
        const choice = pickRandom(scenes);
        return this.factories[choice](opts);
      },
    };
  }

  create(type: string, opts?: Record<string, unknown>): SceneElement | null {
    if (!type || !this.factories[type]) return null;
    const scene = this.factories[type](opts as any);
    return scene;
  }
}
