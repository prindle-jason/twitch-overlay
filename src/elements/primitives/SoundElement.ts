import { Element } from "./Element";
import { getSound } from "../../utils/assets/SoundLoader";
import { EventBus } from "../../core/EventBus";
import { globalSettings } from "../../overlay/GlobalSettingsStore";

export class SoundElement extends Element {
  soundUrl: string;
  sound: HTMLAudioElement | null = null;
  baseVolume = 1;
  loop = false;

  // Only true if the sound was actively playing when paused
  private paused = false;

  // Event handlers stored for cleanup on finish()
  private volumeChangeHandler = this.changeVolume.bind(this);

  constructor(soundUrl: string) {
    super();
    this.soundUrl = soundUrl;
  }

  async init() {
    this.sound = await getSound(this.soundUrl);

    // Subscribe to global settings events
    EventBus.on("global-volume-changed", this.volumeChangeHandler);

    await super.init();
  }

  /** Get the underlying HTMLAudioElement for direct event listening. */
  getSound(): HTMLAudioElement | null {
    return this.sound;
  }

  /** Update sound volume based on current master volume setting. */
  changeVolume(): void {
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

  pauseSound(): void {
    if (this.sound && !this.sound.paused) {
      this.paused = true;
      this.sound.pause();
    }
  }

  stopSound(): void {
    if (this.sound) {
      this.sound.pause();
      this.sound.currentTime = 0;
      this.paused = false;
    }
  }

  override pause(): void {
    if (this.getState() !== "PLAYING") {
      return;
    }

    this.pauseSound();
    super.pause();
  }

  override resume(): void {
    if (this.getState() !== "PAUSED") {
      return;
    }

    if (this.paused) {
      this.playSound();
    }
    super.resume();
  }

  override finish(): void {
    // Unsubscribe from global events
    EventBus.off("global-volume-changed", this.volumeChangeHandler);

    this.stopSound();
    super.finish();
    // Clean up sound reference to prevent memory leaks
    this.sound = null;
  }
}
