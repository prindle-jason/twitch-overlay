import { Element } from "./Element";
import { getSound, type SoundKey } from "../core/resources";
import { EventBus } from "../core/EventBus";
import { globalSettings } from "../core/OverlaySettings";

export class SoundElement extends Element {
  soundKey: SoundKey;
  sound: HTMLAudioElement | null = null;
  baseVolume = 1;
  loop = false;

  // Only true if the sound was actively playing when
  // paused due to a global pause event
  private paused = false;

  // Event handlers stored for cleanup on finish()
  private volumeChangeHandler = () => {
    if (this.sound) {
      this.sound.volume = this.baseVolume * globalSettings.masterVolume;
    }
  };

  private pausedHandler = () => {
    if (this.sound && !this.sound.paused) {
      this.paused = true;
      this.sound.pause();
    }
  };

  private resumedHandler = () => {
    if (this.paused && this.sound) {
      this.sound.play();
      this.paused = false;
    }
  };

  constructor(soundKey: SoundKey) {
    super();
    this.soundKey = soundKey;
  }

  async init() {
    this.sound = await getSound(this.soundKey);

    // Subscribe to global settings events
    EventBus.on("global-volume-changed", this.volumeChangeHandler);
    EventBus.on("global-paused", this.pausedHandler);
    EventBus.on("global-resumed", this.resumedHandler);

    await super.init();
  }

  /** Get the underlying HTMLAudioElement for direct event listening. */
  getSound(): HTMLAudioElement | null {
    return this.sound;
  }

  playSound() {
    if (this.sound) {
      this.sound.volume = this.baseVolume * globalSettings.masterVolume;
      this.sound.loop = this.loop;
      this.sound.play();
    }
  }

  stopSound() {
    if (this.sound) {
      this.sound.pause();
      this.sound.currentTime = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // No-op for sound
  }

  override finish(): void {
    // Unsubscribe from global events
    EventBus.off("global-volume-changed", this.volumeChangeHandler);
    EventBus.off("global-paused", this.pausedHandler);
    EventBus.off("global-resumed", this.resumedHandler);

    this.stopSound();
    super.finish();
    // Clean up sound reference to prevent memory leaks
    this.sound = null;
  }
}
