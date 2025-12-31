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
import { OverlaySettings } from "./OverlaySettings";

type Factory = (opts: Record<string, unknown>) => Effect;

export class EffectManager {
  private loadingEffects: Effect[] = [];
  private playingEffects: Effect[] = [];
  private effectIdCounter = 0;
  private factories: Record<string, Factory>;
  private settings = new OverlaySettings();

  constructor() {
    this.factories = {
      confetti: () => new ConfettiEffect(),
      dvdBounce: () =>
        new DvdEffect({
          spawnEffect: (t: string) => this.spawn(t),
        }),
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
        const choice = effects[Math.floor(Math.random() * effects.length)];
        return this.factories[choice](opts);
      },
      failure: (opts) => {
        const effects = ["ssbmFail", "bamUhOh"];
        const choice = effects[Math.floor(Math.random() * effects.length)];
        return this.factories[choice](opts);
      },
    };
  }

  spawn(type: string, opts?: Record<string, unknown>) {
    if (!type || !this.factories[type]) return;
    const effect = this.factories[type]({
      ...(opts as any),
      id: ++this.effectIdCounter,
    });
    effect.init();
    this.loadingEffects.push(effect);
  }

  applySettings(settings: OverlaySettings) {
    this.settings.applySettings(settings);
  }

  update(deltaTime: number) {
    if (this.settings.paused) return;

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

  getCounts() {
    return {
      loading: this.loadingEffects.length,
      playing: this.playingEffects.length,
    };
  }

  togglePause(): boolean {
    this.settings.paused = !this.settings.paused;
    return this.settings.paused;
  }

  isPaused(): boolean {
    return this.settings.paused;
  }

  clearAll() {
    this.loadingEffects = [];
    this.playingEffects = [];
  }
}
