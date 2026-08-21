import { Element } from "./Element";
import { getSound, getRandomSound } from "../../utils/assets/SoundLoader";
import { EventBus } from "../../core/EventBus";
import { globalSettings } from "../../overlay/GlobalSettingsStore";

type SoundEndedListener = () => void;

export class SoundElement extends Element {
  /** A single sound URL, or a pool of URLs to randomly choose from on init. */
  soundUrl: string | readonly string[];
  sound: HTMLAudioElement | null = null;
  baseVolume = 1;
  loop = false;

  // Only true if the sound was actively playing when paused
  private paused = false;

  // Event handlers stored for cleanup on finish()
  private volumeChangeHandler = this.changeVolume.bind(this);
  private endedListeners = new Set<SoundEndedListener>();
  private soundEndedHandler = () => {
    this.endedListeners.forEach((listener) => listener());
  };

  constructor(soundUrl: string | readonly string[]) {
    super();
    this.soundUrl = soundUrl;
  }

  async init() {
    this.sound = Array.isArray(this.soundUrl)
      ? await getRandomSound(this.soundUrl)
      : await getSound(this.soundUrl as string);
    this.sound.addEventListener("ended", this.soundEndedHandler);

    // Subscribe to global settings events
    EventBus.on("global-volume-changed", this.volumeChangeHandler);

    await super.init();
  }

  /** Get the underlying HTMLAudioElement for direct event listening. */
  getSound(): HTMLAudioElement | null {
    return this.sound;
  }

  /** Subscribe to this SoundElement's natural audio completion event. */
  onEnded(listener: SoundEndedListener): void {
    this.endedListeners.add(listener);
  }

  /** Unsubscribe from this SoundElement's natural audio completion event. */
  offEnded(listener: SoundEndedListener): void {
    this.endedListeners.delete(listener);
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

    if (this.sound) {
      this.sound.removeEventListener("ended", this.soundEndedHandler);
    }
    this.endedListeners.clear();

    this.stopSound();
    super.finish();
    // Clean up sound reference to prevent memory leaks
    this.sound = null;
  }
}
