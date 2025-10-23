// EffectManager.js
// Manages effect creation, state transitions, updates, and rendering

import { ConfettiEffect } from "../effects/ConfettiEffect.js";
import { DvdEffect } from "../effects/DvdEffect.js";
import { XJasonEffect } from "../effects/XJasonEffect.js";
import { BamUhOhEffect } from "../effects/BamUhOhEffect.js";
import { BamSuccessEffect } from "../effects/BamSuccessEffect.js";
import { SsbmFailEffect } from "../effects/SsbmFailEffect.js";
import { SsbmSuccessEffect } from "../effects/SsbmSuccessEffect.js";
import { TickerEffect } from "../effects/TickerEffect.js";
import { WatermarkEffect } from "../effects/WatermarkEffect.js";

export class EffectManager {
  constructor({ W, H }) {
    this.W = W;
    this.H = H;
    this.loadingEffects = [];
    this.playingEffects = [];
    this.effectIdCounter = 0;
    this.factories = {
      confetti: (opts) => new ConfettiEffect(opts),
      dvdBounce: (opts) => new DvdEffect({ ...opts, spawn: (type) => this.spawn(type) }),
      xJason: (opts) => new XJasonEffect(opts),
      success: (opts) => this.successFactory(opts),
      failure: (opts) => this.failureFactory(opts),
      ssbmFail: (opts) => new SsbmFailEffect(opts),
      ssbmSuccess: (opts) => new SsbmSuccessEffect(opts),
      bamSuccess: (opts) => new BamSuccessEffect(opts),
      bamUhOh: (opts) => new BamUhOhEffect(opts),
      ticker: (opts) => new TickerEffect(opts),
      watermark: (opts) => new WatermarkEffect(opts)
    };
  }

  failureFactory(opts) {
    // Randomly pick BamUhOhEffect or SsbmFailEffect with equal probability
    const effects = [BamUhOhEffect, SsbmFailEffect];
    const EffectClass = effects[Math.floor(Math.random() * effects.length)];
    return new EffectClass({ ...opts, W: this.W, H: this.H, id: ++this.effectIdCounter });
  }

  successFactory(opts) {
    const effects = [BamSuccessEffect, SsbmSuccessEffect];
    const EffectClass = effects[Math.floor(Math.random() * effects.length)];
    return new EffectClass({ ...opts, W: this.W, H: this.H, id: ++this.effectIdCounter });
  }

  spawn(type, opts) {
    if (!type || !this.factories[type]) {
      // Optionally handle unknown effect type
      return;
    }
    const effect = this.factories[type]({ ...opts, W: this.W, H: this.H, id: ++this.effectIdCounter });
    effect.init();
    this.loadingEffects.push(effect);
  }

  update(deltaTime) {
    // Move effects from loading to playing when ready
    this.loadingEffects = this.loadingEffects.filter((e) => {
      if (e.getState() === "Playing") {
        e.onPlay();
        this.playingEffects.push(e);
        return false;
      }
      return true;
    });

    // Update and remove finished effects in one loop
    this.playingEffects = this.playingEffects.filter((e) => {
      if (e.state === "Finished") {
        e.onFinish();
        return false;
      }
      e.update(deltaTime);
      return true;
    });
  }

  draw(ctx) {
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
