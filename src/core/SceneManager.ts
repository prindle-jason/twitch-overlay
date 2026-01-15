import { OverlaySettings } from "./OverlaySettings";
import {
  SceneElement,
  TriggerableSceneElement,
} from "../elements/scenes/SceneElement";
import { logger } from "../utils/logger";
import type { PoolId } from "../utils/types";
import { SceneFactory } from "./SceneFactory";

export class SceneManager {
  private scenes: SceneElement[] = [];
  private settings = new OverlaySettings();
  private triggerablePools = new Set<PoolId>(["hypeChat", "dvdBounce"]);

  constructor() {}

  /**
   * Handle a scene pool event, creating new scenes or triggering existing ones.
   */
  handleEvent(poolId: PoolId, payload?: unknown): void {
    if (!SceneFactory.hasPool(poolId)) {
      logger.warn(`No scene factory for pool: ${poolId}`);
      return;
    }

    // For triggerable pools, check if an instance already exists
    if (this.triggerablePools.has(poolId)) {
      const activeTriggerable = this.scenes.find(
        (s) => s instanceof TriggerableSceneElement
      ) as TriggerableSceneElement | undefined;

      if (activeTriggerable) {
        activeTriggerable.handleTrigger(payload);
        return;
      }
    }

    // Create new scene instance
    const scene = SceneFactory.createScene(poolId, payload);
    if (scene) {
      this.addScene(scene);
    }
  }

  /**
   * Add an effect or scene to the manager and initialize it.
   * The item should already be created; this just adds it to the active list.
   */
  async addScene(scene: SceneElement) {
    logger.debug(`Adding scene of type ${scene.constructor.name}`);
    await scene.init();
    logger.debug(`Initialized scene of type ${scene.constructor.name}`);
    scene.onSettingsChanged(this.settings);
    this.scenes.push(scene);
  }

  applySettings(settings: OverlaySettings) {
    this.settings.applySettings(settings);

    // Notify all active items of the settings change
    this.scenes.forEach((scene) => scene.onSettingsChanged(this.settings));
  }

  update(ctx: CanvasRenderingContext2D, deltaTime: number) {
    this.scenes = this.scenes.filter((scene) => {
      const state = scene.getState();

      if (state === "READY") {
        scene.play();
      }

      if (state === "PLAYING") {
        if (!this.settings.paused) {
          scene.update(deltaTime);
        }
        scene.draw(ctx);
      }

      if (state === "FINISHED") {
        scene.finish();
        return false;
      }

      return true;
    });
  }

  getCounts() {
    const loading = this.scenes.filter(
      (s) => s.getState() === "INITIALIZING" || s.getState() === "READY"
    ).length;
    const playing = this.scenes.filter(
      (s) => s.getState() === "PLAYING"
    ).length;
    return {
      loading,
      playing,
    };
  }

  clearAll() {
    // Clear all active scenes
    this.scenes.forEach((scene) => scene.finish());
    this.scenes = [];
  }
}
