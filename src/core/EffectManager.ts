import { PooledDvdEffect } from "../effects/PooledDvdEffect";
import { Effect } from "../effects/Effect";
import { OverlaySettings } from "./OverlaySettings";

export class EffectManager {
  private effects: Effect[] = [];
  private pooledDvdEffect!: PooledDvdEffect;
  private settings = new OverlaySettings();

  constructor() {
    // Create the pooled DVD effect that will always exist
    this.pooledDvdEffect = new PooledDvdEffect();
    this.pooledDvdEffect.init();
    this.effects.push(this.pooledDvdEffect);
  }

  handleEvent(type: string, opts?: Record<string, unknown>) {
    // Handle dvdBounce specially - add to pool instead of creating new effect
    if (type === "dvdBounce") {
      this.pooledDvdEffect.addDvd(opts);
    }
  }

  /**
   * Add an effect to the manager and initialize it.
   * The effect should already be created; this just adds it to the active list.
   */
  addEffect(effect: Effect) {
    effect.init();
    effect.onSettingsChanged(this.settings);
    this.effects.push(effect);
  }

  applySettings(settings: OverlaySettings) {
    this.settings.applySettings(settings);

    // Notify all active effects of the settings change
    this.effects.forEach((effect) => effect.onSettingsChanged(this.settings));
  }

  update(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.effects = this.effects.filter((e) => {
      const state = e.getState();

      if (state === "READY") {
        e.onPlay();
      }

      if (state === "PLAYING") {
        if (!this.settings.paused) {
          e.update(deltaTime);
        }
        e.draw(ctx);
      }

      if (state === "FINISHED") {
        e.onFinish();
        return false;
      }

      return true;
    });
  }

  getCounts() {
    const loading = this.effects.filter(
      (e) => e.getState() === "LOADING" || e.getState() === "READY"
    ).length;
    const playing = this.effects.filter(
      (e) => e.getState() === "PLAYING"
    ).length;
    return {
      loading,
      playing,
    };
  }

  clearAll() {
    // Clear contents of pooled effect but keep it alive
    this.pooledDvdEffect.clear();

    // Clear all other effects
    this.effects
      .filter((e) => e !== this.pooledDvdEffect)
      .forEach((e) => e.onFinish());

    // Keep only the pooled effect
    this.effects = [this.pooledDvdEffect];
  }
}
