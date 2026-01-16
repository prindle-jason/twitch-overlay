import { logger } from "../utils/logger";
import type { GlobalSettings } from "../server/ws-types";

export class OverlaySettings {
  masterVolume: number = 1.0;
  stability: number = 100.0;
  paused: boolean = false;

  /* Optional flag used by dashboard to toggle the paused state */
  togglePause?: boolean;

  constructor(init?: Partial<OverlaySettings> | GlobalSettings) {
    if (init) {
      Object.assign(this, init);
    }
  }

  applySettings(settings: OverlaySettings) {
    logger.info("Applying overlay settings:", settings);
    if (typeof settings.masterVolume === "number") {
      this.masterVolume = settings.masterVolume;
    }
    if (typeof settings.stability === "number") {
      this.stability = settings.stability;
    }
    // if (typeof settings.paused === "boolean") {
    //   this.paused = settings.paused;
    // }
    if (settings.togglePause) {
      this.paused = !this.paused;
    }
  }
}
