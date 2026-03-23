import { logger } from "../utils/logger";
import { globalSettings } from "./GlobalSettingsStore";
import { EventBus } from "../core/EventBus";
import type { SceneManager } from "./SceneManager";
import { pickRandom } from "../utils/random";
import type { PoolType, SceneType } from "../types/SceneTypes";

/**
 * InstabilityManager orchestrates scheduled chaotic events based on stability.
 *
 * Dynamically rescales event timing when stability changes, preserving progress percentage.
 * Event type is selected at fire time based on current chaos level, allowing scenarios
 * to adapt to last-minute stability changes.
 *
 * Stability ranges from 0 (chaos) to 100 (stable):
 * - 100% stability: 2-8 hours between events
 * - 0% stability: 30 seconds - 2 minutes between events
 */
export class InstabilityManager {
  private enabled: boolean = false;
  private timeUntilNextEvent: number | null = null; // milliseconds until next event
  private lastTrackedStability: number = 100; // stability level when last event was scheduled

  // Configuration constants (in milliseconds)
  private readonly BASE_INTERVAL_MIN_MS = 2 * 60 * 60 * 1000; // 2 hours at 100% stability
  private readonly BASE_INTERVAL_MAX_MS = 8 * 60 * 60 * 1000; // 8 hours at 100% stability
  private readonly MIN_INTERVAL_MIN_MS = 30 * 1000; // 30 seconds at 0% stability
  private readonly MIN_INTERVAL_MAX_MS = 2 * 60 * 1000; // 2 minutes at 0% stability

  private readonly sceneManager: SceneManager;

  // Glyph pools used to generate glitchy ticker strings
  private readonly glitchPrefixes = [
    "0x",
    "crc=",
    "ptr@",
    "seg=",
    "hdr=",
    "off@",
    "pkt#",
    "blk:",
    "ts=",
  ];

  private readonly glitchChars = "0123456789ABCDEF!@#$%^&*()-_=+[]{}<>?/|~";

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  /**
   * Enable the instability system and schedule the first event only if none is already scheduled.
   */
  enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    logger.info("[instability] Instability system enabled");

    // Only schedule an event if one hasn't been scheduled yet
    if (this.timeUntilNextEvent === null) {
      this.scheduleNextEvent();
    }

    this.emitStateChanged();
  }

  /**
   * Disable the instability system. Pending events are retained but not fired.
   */
  disable(): void {
    if (!this.enabled) return;

    this.enabled = false;
    logger.info("[instability] Instability system disabled");

    this.emitStateChanged();
  }

  /**
   * Schedule the next event with randomized interval based on current stability.
   * Event type is determined at fire time.
   */
  private scheduleNextEvent(): void {
    const interval = this.calculateRandomInterval(globalSettings.stability);

    this.timeUntilNextEvent = interval;
    this.lastTrackedStability = globalSettings.stability;

    logger.debug(
      `[instability] Next event scheduled in ${(interval / 1000).toFixed(2)}s`,
    );

    this.emitStateChanged();
  }

  /**
   * Calculate a randomized interval based on stability level.
   * Interpolates between base range (100% stability) and min range (0% stability).
   *
   * @param stability Stability level 0-100
   * @returns Interval in milliseconds
   */
  private calculateRandomInterval(stability: number): number {
    const normalizedStability = Math.max(0, Math.min(100, stability)) / 100;

    // Calculate min and max for this stability level
    const minAtStability =
      this.MIN_INTERVAL_MIN_MS +
      (this.BASE_INTERVAL_MIN_MS - this.MIN_INTERVAL_MIN_MS) *
        normalizedStability;
    const maxAtStability =
      this.MIN_INTERVAL_MAX_MS +
      (this.BASE_INTERVAL_MAX_MS - this.MIN_INTERVAL_MAX_MS) *
        normalizedStability;

    // Return random value in range
    return minAtStability + Math.random() * (maxAtStability - minAtStability);
  }

  /**
   * Called when stability changes. Scales the pending event countdown by the stability ratio.
   *
   * Algorithm:
   * timeUntilNextEvent_new = timeUntilNextEvent_old × (newStability / lastTrackedStability)
   *
   * This preserves the event "schedule" while adapting countdown to stability changes.
   * Works correctly with incremental stability updates (+/- a few points).
   */
  onStabilityChanged(newStability: number): void {
    // Allow rescaling even while disabled so dashboards see updated countdowns
    if (this.timeUntilNextEvent === null) return;

    // Scale the remaining time by the stability ratio
    const safePrevious =
      this.lastTrackedStability <= 0 ? 1 : this.lastTrackedStability;
    const stabilityRatio = newStability / safePrevious;
    this.timeUntilNextEvent *= stabilityRatio;
    this.lastTrackedStability = newStability;

    logger.info(
      `[instability] Rescheduled event (ratio: ${stabilityRatio.toFixed(3)}, remaining: ${(this.timeUntilNextEvent / 1000).toFixed(2)}s)`,
    );

    this.emitStateChanged();
  }

  /**
   * Get the time until the next event in milliseconds.
   * Used for countdown display on the dashboard.
   */
  getTimeUntilNextEvent(): number | null {
    return this.timeUntilNextEvent;
  }

  /**
   * Update the instability manager. Call this once per frame.
   * Decrements timeUntilNextEvent by deltaTime, only when enabled.
   * @returns true if an event was fired and rescheduled, false otherwise
   */
  update(deltaTime: number): boolean {
    if (!this.enabled || this.timeUntilNextEvent === null) return false;

    // Decrement the countdown
    this.timeUntilNextEvent -= deltaTime;

    // Fire event if time reached
    if (this.timeUntilNextEvent <= 0) {
      this.triggerInstabilityEvent(globalSettings.stability);
      this.scheduleNextEvent();
      return true;
    }
    return false;
  }

  private emitStateChanged(): void {
    EventBus.emit("instability-state-changed", {
      instabilityEnabled: this.enabled,
      timeUntilNextEventMs: this.timeUntilNextEvent,
      stability: globalSettings.stability,
    });
  }

  /**
   * Trigger an instability event based on current stability level.
   * Event type is determined at fire time (not predetermined).
   */
  private triggerInstabilityEvent(stability: number): void {
    // Select which type of event based on stability level
    const roll = Math.random() * 100;

    if (stability <= 20) {
      // Very unstable: all effects possible
      if (roll < 30) this.spawnGlitchScene();
      else if (roll < 50) this.spawnGlitchRepeater();
      else if (roll < 70) this.spawnInstabilityTicker();
      else this.spawnRandomScene();
    } else if (stability <= 50) {
      // Moderately unstable: mostly spawning
      if (roll < 25) this.spawnGlitchScene();
      else if (roll < 50) this.spawnGlitchRepeater();
      else this.spawnInstabilityTicker();
    } else {
      // Mostly stable: subtle effects
      if (roll < 50) this.spawnInstabilityTicker();
      else this.spawnGlitchScene();
    }

    logger.info(
      `[instability] Triggered event at stability level ${stability}`,
    );
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
    const message = this.generateInstabilityTickerMessage();
    this.sceneManager.handleSceneEvent("ticker", {
      cleanMessage: message,
    });
  }

  private generateInstabilityTickerMessage(): string {
    const prefix = Math.random() < 0.7 ? pickRandom(this.glitchPrefixes) : "";
    const targetLength = 33 + Math.floor(Math.random() * 16); // 33-48 chars of body
    let body = "";

    while (body.length < targetLength) {
      body += this.randomGlitchChar();
    }

    return `${prefix}${body.slice(0, targetLength)}`;
  }

  private randomGlitchChar(): string {
    const idx = Math.floor(Math.random() * this.glitchChars.length);
    return this.glitchChars[idx];
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
   * Get whether the instability system is currently enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Manually trigger an instability event (called from dashboard).
   * If sceneType is "ticker", spawns an instability ticker.
   * Otherwise does nothing (reserved for future expansion).
   */
  triggerManualEvent(sceneType?: SceneType): void {
    if (sceneType === "ticker") {
      logger.info("[instability] Manual ticker event triggered");
      this.spawnInstabilityTicker();
    } else if (sceneType) {
      logger.warn(`[instability] Unsupported manual sceneType: ${sceneType}`);
    }
  }
}
