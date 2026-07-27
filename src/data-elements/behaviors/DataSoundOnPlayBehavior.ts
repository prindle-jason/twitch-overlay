import { DataElement } from "../primitives/DataElement";
import { DataSoundElement } from "../primitives/DataSoundElement";
import { logger } from "../../utils/logger";

/**
 * Data-driven behavior that plays a parent DataSoundElement when this behavior is played.
 * Mirrors SoundOnPlayBehavior but works with data-driven sound elements.
 */
export class DataSoundOnPlayBehavior extends DataElement {
  constructor(config: Record<string, unknown> = {}) {
    super({ id: (config as any).id });
    logger.warn("[DataSoundOnPlay] Created");
  }

  private get target(): DataSoundElement | null {
    return this.parent instanceof DataSoundElement
      ? (this.parent as DataSoundElement)
      : null;
  }

  override async init(): Promise<void> {
    logger.warn("[DataSoundOnPlay] init() called");
    await super.init();
    logger.warn("[DataSoundOnPlay] init() complete - transitioning to READY");
  }

  override play(): void {
    logger.warn("[DataSoundOnPlay] play() called");
    super.play();

    if (this.target) {
      logger.warn("[DataSoundOnPlay] Calling playSound() on parent");
      this.target.playSound();
    } else {
      logger.warn("[DataSoundOnPlay] Parent is not a DataSoundElement");
    }
  }

  override pause(): void {
    logger.warn("[DataSoundOnPlay] pause() called");
    super.pause();
  }

  override resume(): void {
    logger.warn("[DataSoundOnPlay] resume() called");
    super.resume();
  }

  override finish(): void {
    logger.warn("[DataSoundOnPlay] finish() called - destroying behavior");
    super.finish();
    logger.warn("[DataSoundOnPlay] finish() complete - behavior destroyed");
  }
}
