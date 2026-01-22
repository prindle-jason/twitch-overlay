import { logger } from "../utils/logger";
import { globalSettings } from "./OverlaySettings";
import type { SceneManager } from "./SceneManager";
import { pickRandom } from "../utils/random";
import type { PoolType } from "../types/SceneTypes";

/**
 * InstabilityManager orchestrates chaotic effects based on the stability setting.
 * Stability ranges from 0 (chaos) to 100 (stable).
 *
 * - Low chaos (95-100% stability): Minor visual glitches
 * - Medium chaos (50-95% stability): Scene spawning, visual distortions
 * - High chaos (0-50% stability): Aggressive effects, persistence
 */
export class InstabilityManager {
  private timeSinceLastEvent: number = 0;
  private canvasPersistenceEnabled: boolean = false;
  private readonly sceneManager: SceneManager;

  // Predefined glitch ticker messages
  //   private readonly glitchMessages = [
  //     "GL1TCH D3T3CT3D",
  //     "$YST3M F41LURE",
  //     "3RR0R 404",
  //     "CORRUPTED D4T4",
  //     "P1X3L N01S3",
  //     "SYN4X ERROR",
  //     "M3M0RY L34K",
  //   ];

  // Ticker messages for instability spawning
  private readonly instabilityTickerMessages = [
    "SYSTEM UNSTABLE",
    "REALITY GLITCHING",
    "ANOMALY DETECTED",
    "CHAOS UNLEASHED",
    "EQUILIBRIUM LOST",
  ];

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  /**
   * Update the instability manager. Call this once per frame.
   */
  update(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    // Calculate chaos level (inverse of stability: 0-100)
    const chaos = 100 - globalSettings.stability;

    if (chaos === 0) {
      // No chaos, disable persistence
      this.canvasPersistenceEnabled = false;
      return;
    }

    // Update timing
    this.timeSinceLastEvent += deltaTime;

    // Calculate event frequency: lower stability = more frequent events
    // Chaos of 100 = event every 500ms, chaos of 10 = event every 5000ms
    const eventIntervalMs = 5000 - chaos * 45; // Maps 100→500, 10→5000

    if (this.timeSinceLastEvent >= eventIntervalMs) {
      this.triggerInstabilityEvent(chaos);
      this.timeSinceLastEvent = 0;
    }

    // Update canvas persistence based on chaos
    const shouldPersist = chaos > 50 && Math.random() < (chaos - 50) / 100;
    this.canvasPersistenceEnabled = shouldPersist;
  }

  /**
   * Get whether canvas persistence should be enabled this frame.
   */
  isCanvasPersistenceEnabled(): boolean {
    return this.canvasPersistenceEnabled;
  }

  /**
   * Trigger a random instability event based on chaos level.
   */
  private triggerInstabilityEvent(chaos: number): void {
    // Select which type of event based on chaos intensity
    const roll = Math.random() * 100;

    if (chaos >= 80) {
      // High chaos: all effects possible
      if (roll < 30) this.spawnGlitchScene();
      else if (roll < 50) this.spawnGlitchRepeater();
      else if (roll < 70) this.spawnInstabilityTicker();
      else this.spawnRandomScene();
    } else if (chaos >= 50) {
      // Medium chaos: mostly spawning
      if (roll < 25) this.spawnGlitchScene();
      else if (roll < 50) this.spawnGlitchRepeater();
      else this.spawnInstabilityTicker();
    } else {
      // Low chaos: subtle effects
      if (roll < 50) this.spawnInstabilityTicker();
      else this.spawnGlitchScene();
    }

    logger.debug(`[instability] Triggered event at chaos level ${chaos}`);
  }

  /**
   * Spawn a glitch scene with corrupted audio and visual artifacts.
   */
  private spawnGlitchScene(): void {
    logger.info("[instability] Spawning glitch scene");
    this.sceneManager.handleSceneEvent("glitch");
  }

  /**
   * Spawn a glitch repeater scene that plays a glitch scene repeatedly.
   */
  private spawnGlitchRepeater(): void {
    logger.info("[instability] Spawning glitch repeater");
    this.sceneManager.handleSceneEvent("glitchRepeater");
  }

  /**
   * Spawn a ticker scene with instability messages.
   */
  private spawnInstabilityTicker(): void {
    logger.info("[instability] Spawning instability ticker");
    const message = pickRandom(this.instabilityTickerMessages);
    this.sceneManager.handleSceneEvent("ticker", {
      cleanMessage: message,
    });
  }

  /**
   * Spawn a random scene from the available pools.
   */
  private spawnRandomScene(): void {
    logger.info("[instability] Spawning random scene");
    const poolTypes: PoolType[] = ["success", "failure"];
    const poolType = pickRandom(poolTypes);
    this.sceneManager.handlePoolEvent(poolType);
  }

  /**
   * Reset instability state (called when stability changes).
   */
  reset(): void {
    this.timeSinceLastEvent = 0;
    this.canvasPersistenceEnabled = false;
  }
}
