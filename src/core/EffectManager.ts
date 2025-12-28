import { ConfettiEffect } from "../../effects/ConfettiEffect.js";
import { DvdEffect } from "../../effects/DvdEffect.js";
import { XJasonEffect } from "../../effects/XJasonEffect.js";
import { BamUhOhEffect } from "../../effects/BamUhOhEffect.js";
import { BamSuccessEffect } from "../effects/BamSuccessEffect";
import { Effect } from "../effects/Effect.js";
import { SsbmFailEffect } from "../../effects/SsbmFailEffect.js";
import { SsbmSuccessEffect } from "../../effects/SsbmSuccessEffect.js";
import { TickerEffect } from "../../effects/TickerEffect.js";
import { WatermarkEffect } from "../../effects/WatermarkEffect.js";
import { HeadbladeEffect } from "../../effects/HeadbladeEffect.js";
import { getCanvasConfig } from "../config";

type Factory = (opts: Record<string, unknown>) => Effect;

export class EffectManager {
  private loadingEffects: Effect[] = [];
  private playingEffects: Effect[] = [];
  private effectIdCounter = 0;
  private factories: Record<string, Factory>;

  constructor() {
    this.factories = {
      //confetti: (opts) => new ConfettiEffect(opts as any),
      //dvdBounce: (opts) =>
      //  new DvdEffect({
      //    ...(opts as any),
      //    spawn: (type: string) => this.spawn(type),
      //  } as any),
      //xJason: (opts) => new XJasonEffect(opts as any),
      //success: (opts) => this.successFactory(opts),
      //failure: (opts) => this.failureFactory(opts),
      //ssbmFail: (opts) => new SsbmFailEffect(opts as any),
      //ssbmSuccess: (opts) => new SsbmSuccessEffect(opts as any),
      bamSuccess: (opts) => new BamSuccessEffect(opts as any),
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
