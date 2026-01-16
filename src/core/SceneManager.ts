import { OverlaySettings } from "./OverlaySettings";
import {
  SceneElement,
  TriggerableSceneElement,
} from "../elements/scenes/SceneElement";
import { logger } from "../utils/logger";
import type { PoolType, SceneType } from "../utils/types";
import type { Settings } from "../server/ws-types";
import { SceneFactory } from "./SceneFactory";

export class SceneManager {
  private scenes: SceneElement[] = [];
  private settings = new OverlaySettings();
  private triggerableSceneTypes = new Set<SceneType>(["hypeChat", "dvdBounce"]);

  constructor() {}

  /**
   * Handle a scene pool event, creating new scenes or triggering existing ones.
   */
  handleSceneEvent(sceneType: SceneType, payload?: unknown): void {
    // if (!SceneFactory.hasPool(poolId)) {
    //   logger.warn(`No scene factory for pool: ${poolId}`);
    //   return;
    // }

    // For triggerable scenes, check if an instance already exists
    if (this.triggerableSceneTypes.has(sceneType)) {
      const activeTriggerables = this.scenes.filter(
        (s) => s instanceof TriggerableSceneElement && s.type === sceneType
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

  /**
   * Configure a running scene by its type identifier.
   * Only sends config to scenes that are currently active.
   */
  configureScene(sceneType: string, config: Settings) {
    const targetScene = this.scenes.find((s) => s.type === sceneType);
    if (targetScene) {
      targetScene.onSceneConfig(config);
    } else {
      logger.debug(
        `[SceneManager] No active scene of type ${sceneType} to configure`
      );
    }
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
