import { DataElement } from "./DataElement";
import { getSound } from "../../utils/assets/SoundLoader";
import { EventBus } from "../../core/EventBus";
import { globalSettings } from "../../overlay/GlobalSettingsStore";
import { logger } from "../../utils/logger";

interface DataSoundElementConfig {
  audioUrl?: string;
  loop?: boolean;
  baseVolume?: number;
  id?: string;
}

/**
 * Data-driven sound element. Duplicates SoundElement functionality but:
 * - Extends DataElement instead of Element for data-driven lifecycle
 * - Emits "sound-ended" event to parent when audio completes naturally
 * - Uses local event system for parent-child communication
 * - Maintains global volume handling via EventBus
 */
export class DataSoundElement extends DataElement {
  private audioUrl: string;
  private sound: HTMLAudioElement | null = null;
  private baseVolume: number;
  private loop: boolean;

  // Only true if the sound was actively playing when paused
  private paused = false;

  // Event handlers stored for cleanup on finish()
  private volumeChangeHandler = this.changeVolume.bind(this);
  private soundEndedHandler = () => {
    logger.warn("[DataSound] Sound ended, emitting to parent and finishing", { id: this.id });
    this.parent?.emitEvent("sound-ended", { soundId: this.id });
    this.finish();
  };

  constructor(config: Partial<DataSoundElementConfig> = {}) {
    super({ id: config.id });
    this.audioUrl = config.audioUrl ?? "";
    this.baseVolume = config.baseVolume ?? 1;
    this.loop = config.loop ?? false;

    logger.warn("[DataSound] Created", { audioUrl: config.audioUrl, id: this.id });
  }

  override async init(): Promise<void> {
    logger.warn("[DataSound] init() called");

    this.sound = await getSound(this.audioUrl);
    this.sound.addEventListener("ended", this.soundEndedHandler);

    // Subscribe to global settings events
    EventBus.on("global-volume-changed", this.volumeChangeHandler);

    await super.init();
    logger.warn("[DataSound] init() complete - transitioning to READY");
  }

  /** Get the underlying HTMLAudioElement for direct event listening. */
  getSound(): HTMLAudioElement | null {
    return this.sound;
  }

  /** Update sound volume based on current master volume setting. */
  private changeVolume(): void {
    if (this.sound) {
      this.sound.volume = this.baseVolume * globalSettings.masterVolume;
    }
  }

  playSound(): void {
    if (this.sound) {
      this.sound.volume = this.baseVolume * globalSettings.masterVolume;
      this.sound.loop = this.loop;
      this.sound.play();
      this.paused = false;
    }
  }

  private pauseSound(): void {
    if (this.sound && !this.sound.paused) {
      this.paused = true;
      this.sound.pause();
    }
  }

  private stopSound(): void {
    if (this.sound) {
      this.sound.pause();
      this.sound.currentTime = 0;
      this.paused = false;
    }
  }

  override pause(): void {
    logger.warn("[DataSound] pause() called");
    if (this.getState() !== "PLAYING") {
      return;
    }

    this.pauseSound();
    super.pause();
  }

  override resume(): void {
    logger.warn("[DataSound] resume() called");
    if (this.getState() !== "PAUSED") {
      return;
    }

    if (this.paused) {
      this.playSound();
    }
    super.resume();
  }

  override finish(): void {
    logger.warn("[DataSound] finish() called - destroying sound element", { id: this.id });

    // Unsubscribe from global events
    EventBus.off("global-volume-changed", this.volumeChangeHandler);

    if (this.sound) {
      this.sound.removeEventListener("ended", this.soundEndedHandler);
    }

    this.stopSound();
    super.finish();

    // Clean up sound reference to prevent memory leaks
    this.sound = null;
    logger.warn("[DataSound] finish() complete - sound element destroyed");
  }
}
