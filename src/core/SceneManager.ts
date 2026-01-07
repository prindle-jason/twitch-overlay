import { OverlaySettings } from "./OverlaySettings";
import { SceneElement } from "../elements/scenes/SceneElement";
import { PooledDvdScene } from "../elements/scenes/PooledDvdScene";
import { logger } from "../utils/logger";

export class SceneManager {
  private scenes: SceneElement[] = [];
  private pooledDvdScene!: PooledDvdScene;
  private settings = new OverlaySettings();

  constructor() {
    // Create the pooled DVD effect that will always exist
    this.pooledDvdScene = new PooledDvdScene();
    this.addScene(this.pooledDvdScene);
  }

  handleEvent(type: string, opts?: Record<string, unknown>) {
    // Handle dvdBounce specially - add to pool instead of creating new effect
    if (type === "dvdBounce") {
      this.pooledDvdScene.addDvd(opts);
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
    // Clear contents of pooled effect but keep it alive
    this.pooledDvdScene.clear();

    // Clear all other items
    this.scenes
      .filter((scene) => scene !== this.pooledDvdScene)
      .forEach((scene) => scene.finish());

    // Keep only the pooled effect
    this.scenes = [this.pooledDvdScene];
  }
}
