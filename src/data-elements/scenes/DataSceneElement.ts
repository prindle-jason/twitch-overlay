import { DataElement, DataElementConfig } from "../primitives/DataElement";
import { logger } from "../../utils/logger";

interface DataSceneElementConfig extends DataElementConfig {}

/**
 * DataSceneElement wraps root elements from a data-driven JSON config.
 * All root elements are added as children via factory, keeping them together as a cohesive unit.
 * Extends DataElement for full lifecycle and event system support.
 *
 * Child event listeners are configured via the base class and automatically set up during init.
 */
export class DataSceneElement extends DataElement {
  constructor(config: Partial<DataSceneElementConfig> = {}) {
    super(config);
    logger.warn("[DataScene] Created");
  }

  override async init(): Promise<void> {
    logger.warn("[DataScene] init() called");
    await super.init();
    logger.warn("[DataScene] init() complete - transitioning to READY");
  }

  override play(): void {
    logger.warn("[DataScene] play() called");
    super.play();
    logger.warn("[DataScene] play() complete - transitioning to PLAYING");
  }

  override pause(): void {
    logger.warn("[DataScene] pause() called");
    super.pause();
  }

  override resume(): void {
    logger.warn("[DataScene] resume() called");
    super.resume();
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
  }

  override finish(): void {
    // Short-term check to prevent double finish logs
    if (this.state === "FINISHED") {
      return;
    }
    logger.warn("[DataScene] finish() called - destroying scene");
    super.finish();
    logger.warn("[DataScene] finish() complete - scene destroyed");
  }
}
