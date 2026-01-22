import { logger } from "../utils/logger";
import { EventBus } from "../core/EventBus";
import type { GlobalSettings } from "../types/settings";

export class GlobalSettingsStore {
  masterVolume: number = 1.0;
  stability: number = 100.0;
  paused: boolean = false;

  /* Optional flag used by dashboard to toggle the paused state */
  togglePause?: boolean;

  constructor(init?: Partial<GlobalSettingsStore> | GlobalSettings) {
    if (init) {
      Object.assign(this, init);
    }
  }

  applySettings(settings: GlobalSettings) {
    logger.info("Applying overlay settings:", settings);
    if (
      typeof settings.masterVolume === "number" &&
      settings.masterVolume !== this.masterVolume
    ) {
      this.masterVolume = settings.masterVolume;
      EventBus.emit("global-volume-changed", {
        masterVolume: this.masterVolume,
      });
    }
    if (typeof settings.stability === "number") {
      this.stability = settings.stability;
    }
    // Handle pause state changes
    if (settings.togglePause) {
      this.paused = !this.paused;
      if (this.paused) {
        EventBus.emit("global-paused", { paused: true });
      } else {
        EventBus.emit("global-resumed", { paused: false });
      }
    }
  }
}

// Backwards compatibility: maintain OverlaySettings as an aliasable value
export class OverlaySettings extends GlobalSettingsStore {}

// Singleton instances for global access
export const globalSettings = new GlobalSettingsStore();
