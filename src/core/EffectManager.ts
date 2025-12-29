import { ConfettiEffect } from "../effects/ConfettiEffect";
import { DvdEffect } from "../effects/DvdEffect";
import { XJasonEffect } from "../effects/XJasonEffect";
import { TickerEffect } from "../effects/TickerEffect";
import { WatermarkEffect } from "../effects/WatermarkEffect";
import { ConvergingSlideEffect } from "../effects/ConvergingSlideEffect";
import { CenteredImageEffect } from "../effects/CenteredImageEffect";
import { HeadbladeEffect } from "../effects/HeadbladeEffect";
import { Effect } from "../effects/Effect";
import { getCanvasConfig } from "../config";

type Factory = (opts: Record<string, unknown>) => Effect;

export class EffectManager {
  private loadingEffects: Effect[] = [];
  private playingEffects: Effect[] = [];
  private effectIdCounter = 0;
  private factories: Record<string, Factory>;

  constructor() {
    this.factories = {
      confetti: () => new ConfettiEffect(),
      dvdBounce: () =>
        new DvdEffect({
          spawnEffect: (type: string) => this.spawn(type),
        }),
      xJason: () => new XJasonEffect(),
      ticker: (opts) => new TickerEffect(opts as any),
      //success: (opts) => this.successFactory(opts),
      //failure: (opts) => this.failureFactory(opts),
      ssbmFail: () => CenteredImageEffect.createSsbmFail(),
      ssbmSuccess: () => CenteredImageEffect.createSsbmSuccess(),
      bamSuccess: () => ConvergingSlideEffect.createBamSuccess(),
      bamUhOh: () => ConvergingSlideEffect.createBamFailure(),
      headblade: () => new HeadbladeEffect(),
      watermark: () => new WatermarkEffect(),
      //bamUhOh: (opts) => new BamUhOhEffect(opts as any),
      //ticker: (opts) => new TickerEffect(opts as any),
      //watermark: (opts) => new WatermarkEffect(opts as any),
      //headblade: (opts) => new HeadbladeEffect(opts as any),
    };
  }

  // private failureFactory(opts: Record<string, unknown>): EffectLike {
  //   const { W, H } = getCanvasConfig();
  //   const effects = [BamUhOhEffect, SsbmFailEffect];
  //   const EffectClass = effects[Math.floor(Math.random() * effects.length)];
  //   return new EffectClass({
  //     ...(opts as any),
  //     W,
  //     H,
  //     id: ++this.effectIdCounter,
  //   } as any);
  // }

  // private successFactory(opts: Record<string, unknown>): EffectLike {
  //   const { W, H } = getCanvasConfig();
  //   const effects = [BamSuccessEffect, SsbmSuccessEffect];
  //   const EffectClass = effects[Math.floor(Math.random() * effects.length)];
  //   return new EffectClass({
  //     ...(opts as any),
  //     W,
  //     H,
  //     id: ++this.effectIdCounter,
  //   } as any);
  // }

  spawn(type: string, opts?: Record<string, unknown>) {
    if (!type || !this.factories[type]) return;
    const effect = this.factories[type]({
      ...(opts as any),
      id: ++this.effectIdCounter,
    });
    effect.init();
    this.loadingEffects.push(effect);
  }

  update(deltaTime: number) {
    this.loadingEffects = this.loadingEffects.filter((e) => {
      if (e.getState() === "READY") {
        e.onPlay();
        this.playingEffects.push(e);
        return false;
      }
      return true;
    });

    this.playingEffects = this.playingEffects.filter((e) => {
      if (e.getState() === "FINISHED") {
        e.onFinish();
        return false;
      }
      e.update(deltaTime);
      return true;
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.playingEffects.length; i++) {
      const e = this.playingEffects[i];
      e.draw(ctx);
    }
  }

  clear() {
    this.loadingEffects = [];
    this.playingEffects = [];
  }
}
