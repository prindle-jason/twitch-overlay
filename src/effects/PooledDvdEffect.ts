import { Effect } from "./Effect";
import { ConfettiEffect } from "./ConfettiEffect";
import { DvdElement } from "../elements/DvdElement";
import { OverlaySettings } from "../core/OverlaySettings";

/**
 * PooledDvdEffect manages multiple DVD logos that bounce around the screen.
 * Instead of creating a new effect for each DVD, they all share one effect instance.
 * This allows for centralized control and potential interactions between DVDs.
 */
export class PooledDvdEffect extends Effect {
  private dvdElements: DvdElement[] = [];
  private confettiEffects: ConfettiEffect[] = [];

  constructor() {
    super();
    this.duration = -1; // Infinite - never finishes on its own
  }

  override async init(): Promise<void> {
    this.state = "READY";
  }

  /**
   * Add a new DVD to the pool
   */
  async addDvd(opts?: Record<string, unknown>): Promise<void> {
    const dvd = new DvdElement();
    await dvd.init();
    dvd.onPlay();
    this.dvdElements.push(dvd);
    console.log(
      `[PooledDvdEffect] Added DVD, pool size: ${this.dvdElements.length}`
    );
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    // Update all DVDs and filter out finished ones
    this.dvdElements = this.dvdElements.filter((dvd) => {
      dvd.update(deltaTime);

      if (dvd.getState() === "FINISHED") {
        // Spawn confetti when DVD finishes
        this.spawnConfetti();
        dvd.onFinish();
        console.log(
          `[PooledDvdEffect] DVD finished, pool size: ${
            this.dvdElements.length - 1
          }`
        );
        return false;
      }

      return true;
    });

    // Update confetti effects and filter out finished ones
    this.confettiEffects = this.confettiEffects.filter((confetti) => {
      if (confetti.getState() === "READY") {
        confetti.onPlay();
      }

      if (confetti.getState() === "PLAYING") {
        confetti.update(deltaTime);
      }

      if (confetti.getState() === "FINISHED") {
        confetti.onFinish();
        return false;
      }

      return true;
    });
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    // Draw all active DVDs
    this.dvdElements.forEach((dvd) => dvd.draw(ctx));

    // Draw all active confetti effects
    this.confettiEffects.forEach((confetti) => confetti.draw(ctx));
  }

  override onFinish(): void {
    // Clean up all DVDs
    this.dvdElements.forEach((dvd) => dvd.onFinish());
    this.dvdElements = [];

    // Clean up all confetti
    this.confettiEffects.forEach((e) => e.onFinish());
    this.confettiEffects = [];

    super.onFinish();
  }

  /**
   * Clear all DVDs and confetti from the pool without destroying the effect itself.
   * Used when clearing effects from the dashboard.
   */
  clear(): void {
    this.dvdElements.forEach((dvd) => dvd.onFinish());
    this.dvdElements = [];
    this.confettiEffects.forEach((e) => e.onFinish());
    this.confettiEffects = [];
    console.log("[PooledDvdEffect] Cleared all DVDs and confetti");
  }

  override onSettingsChanged(settings: OverlaySettings): void {
    // Propagate settings to all DVDs
    this.dvdElements.forEach((dvd) => dvd.onSettingsChanged(settings));

    // Propagate settings to confetti effects
    this.confettiEffects.forEach((c) => c.onSettingsChanged(settings));
  }

  private spawnConfetti(): void {
    const confetti = new ConfettiEffect();
    confetti.init();
    this.confettiEffects.push(confetti);
  }
}
