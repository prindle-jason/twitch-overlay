import {
  SceneElement,
  TriggerableSceneElement,
} from "../elements/scenes/SceneElement";
import { logger } from "../utils/logger";
import { EventBus } from "../core/EventBus";
import type { PoolType, SceneType } from "../types/SceneTypes";
import type { Settings } from "../types/settings";
import { SceneFactory } from "./SceneFactory";

/**
 * Orchestrates the lifecycle of active scenes: creation, triggering,
 * configuration, per-frame update/draw, and teardown.
 *
 * Responsibilities:
 * - Scene instantiation from `SceneType` or `PoolType` via `SceneFactory`.
 * - In-place triggering for persistent scenes (`TriggerableSceneElement`).
 * - Forwarding global settings and targeted scene configuration.
 * - Advancing scene lifecycles each tick and removing finished scenes.
 *
 * Runtime behavior:
 * - On each `update` tick, READY scenes are started, PLAYING scenes are updated
 *   (unless globally paused) and drawn, and FINISHED scenes are finalized and
 *   removed.
 * - Drawing proceeds even while paused; only the logical update step is
 *   skipped.
 */
export class SceneManager {
  private scenes: SceneElement[] = [];
  private handleGlobalPaused = () => this.pauseAllScenes();
  private handleGlobalResumed = () => this.resumeAllScenes();
  /**
   * Registry of scene types that are persistent and should be triggered
   * in-place if already active. When adding a new triggerable scene, include its
   * `SceneType` here to enable the behavior.
   */
  private triggerableSceneTypes = new Set<SceneType>(["hypeChat", "dvdBounce"]);

  constructor() {
    EventBus.on("global-paused", this.handleGlobalPaused);
    EventBus.on("global-resumed", this.handleGlobalResumed);
  }

  /**
   * Handle a scene type event: trigger existing persistent scenes, or create a
   * new instance if none is active.
   */
  handleSceneEvent(sceneType: SceneType, payload?: unknown): void {
    // For triggerable scenes, check if an instance already exists
    if (this.triggerableSceneTypes.has(sceneType)) {
      const activeTriggerables = this.scenes.filter(
        (s) => s instanceof TriggerableSceneElement && s.type === sceneType,
      ) as TriggerableSceneElement[];

      if (activeTriggerables.length > 0) {
        activeTriggerables.forEach((s) => s.handleTrigger(payload));
        return;
      }
    }

    // Create new scene instance
    const scene = SceneFactory.createScene(sceneType, payload);
    if (scene) {
      this.addScene(scene);
    }
  }

  /**
   * Handle a pool event: create a new scene selected randomly from the pool's
   * variants.
   */
  handlePoolEvent(poolType: PoolType, payload?: unknown): void {
    if (!SceneFactory.hasPool(poolType)) {
      logger.warn(`No scene factory for pool: ${poolType}`);
      return;
    }

    // Create new scene instance
    const scene = SceneFactory.createSceneFromPool(poolType, payload);
    if (scene) {
      this.addScene(scene);
    }
  }

  /**
   * Add a scene to the manager and initialize it.
   * The instance should be constructed already; this method performs `init()`
   * and then adds it to the active list.
   */
  async addScene(scene: SceneElement) {
    logger.debug(`Adding scene ${scene.constructor.name} (${scene.type})`);
    await scene.init();
    logger.debug(`Initialized scene ${scene.constructor.name} (${scene.type})`);
    this.scenes.push(scene);
  }

  /**
   * Configure an active scene by its type identifier.
   * Only applies to scenes currently managed; ignored otherwise.
   */
  configureScene(sceneType: SceneType, config: Settings) {
    const targetScene = this.scenes.find((s) => s.type === sceneType);
    if (targetScene) {
      targetScene.onSceneConfig(config);
    } else {
      logger.debug(
        `[SceneManager] No active scene of type ${sceneType} to configure`,
      );
    }
  }

  /**
   * Advance lifecycles and render all active scenes. Called once per frame with
   * the canvas context and elapsed time since the last tick.
   */
  update(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.scenes = this.scenes.filter((scene) => {
      const state = scene.getState();

      switch (state) {
        case "READY":
          scene.play();
          return true;

        case "PLAYING":
          scene.update(deltaTime);
        // Fall through to draw
        case "PAUSED":
          scene.draw(ctx);
          return true;

        case "FINISHED":
          scene.finish();
          return false;

        case "NEW":
        case "INITIALIZING":
        default:
          return true;
      }
    });
  }

  /** Pause all active scenes via lifecycle cascade. */
  private pauseAllScenes(): void {
    this.scenes.forEach((scene) => scene.pause());
  }

  /** Resume all active scenes via lifecycle cascade. */
  private resumeAllScenes(): void {
    this.scenes.forEach((scene) => scene.resume());
  }

  /**
   * Return the number of active scenes managed by this instance.
   */
  getSceneCount(): number {
    return this.scenes.length;
  }

  /**
   * Finish and remove all active scenes.
   */
  clearAll() {
    // Clear all active scenes
    this.scenes.forEach((scene) => scene.finish());
    this.scenes = [];
  }
}
