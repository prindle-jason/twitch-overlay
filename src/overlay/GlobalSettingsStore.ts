import { logger } from "../utils/logger";
import { EventBus } from "../core/EventBus";
import type { GlobalSettings } from "../types/settings";

export class GlobalSettingsStore {
  private static readonly STORAGE_KEY = "overlay-global-settings";

  masterVolume: number = 1.0;
  stability: number = 100.0;
  instabilityEnabled: boolean = false;
  paused: boolean = false;

  constructor() {
    this.applyStoredSettings();
  }

  /**
   * Apply incoming settings with clamping and change detection.
   * Returns true if any stored value changed after clamping.
   */
  applySettings(settings: GlobalSettings): boolean {
    logger.info("Applying overlay settings:", settings);

    let changed = false;
    let persistentChanged = false;

    if (typeof settings.masterVolume === "number") {
      const clampedVolume = Math.max(0, Math.min(1, settings.masterVolume));
      if (clampedVolume !== this.masterVolume) {
        this.masterVolume = clampedVolume;
        changed = true;
        persistentChanged = true;
        EventBus.emit("global-volume-changed", {
          masterVolume: this.masterVolume,
        });
      }
    }

    if (typeof settings.stability === "number") {
      const clampedStability = Math.max(0, Math.min(100, settings.stability));
      if (clampedStability !== this.stability) {
        this.stability = clampedStability;
        changed = true;
        persistentChanged = true;
        EventBus.emit("global-stability-changed", {
          stability: this.stability,
        });
      }
    }

    if (settings.toggleInstability === true) {
      this.instabilityEnabled = !this.instabilityEnabled;
      changed = true;
      persistentChanged = true;
      EventBus.emit("instability-toggled", {
        instabilityEnabled: this.instabilityEnabled,
      });
    }

    // Handle pause state changes (toggle is command-like; always acts once)
    if (settings.togglePause === true) {
      this.paused = !this.paused;
      changed = true;
      if (this.paused) {
        EventBus.emit("global-paused", { paused: true });
      } else {
        EventBus.emit("global-resumed", { paused: false });
      }
    }

    if (persistentChanged) {
      this.persistSettings();
    }

    return changed;
  }

  /** Snapshot of current global settings for broadcasting. */
  getSettings(): GlobalSettings {
    return {
      target: "global",
      masterVolume: this.masterVolume,
      stability: this.stability,
    };
  }

  private applyStoredSettings(): void {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const raw = window.localStorage.getItem(GlobalSettingsStore.STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const stored: GlobalSettings = { target: "global" };

      if (typeof parsed.masterVolume === "number") {
        stored.masterVolume = parsed.masterVolume;
      }
      if (typeof parsed.stability === "number") {
        stored.stability = parsed.stability;
      }

      this.applySettings(stored);
    } catch (err) {
      logger.warn("Failed to load global settings from localStorage", err);
    }
  }

  private persistSettings(): void {
    if (typeof window === "undefined" || !window.localStorage) return;

    const toStore = {
      masterVolume: this.masterVolume,
      stability: this.stability,
      instabilityEnabled: this.instabilityEnabled,
    };

    try {
      window.localStorage.setItem(
        GlobalSettingsStore.STORAGE_KEY,
        JSON.stringify(toStore),
      );
    } catch (err) {
      logger.warn("Failed to persist global settings to localStorage", err);
    }
  }
}

// Singleton instances for global access
export const globalSettings = new GlobalSettingsStore();
