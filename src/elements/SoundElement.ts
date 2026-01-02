import { Element } from "./Element";
import { getSound, type SoundKey } from "../core/resources";
import type { OverlaySettings } from "../core/OverlaySettings";

export class SoundElement extends Element {
  soundKey: SoundKey;
  sound: HTMLAudioElement | null = null;
  baseVolume = 1;
  masterVolume = 1;
  loop = false;
  private wasPlayingBeforePause = false;

  constructor(soundKey: SoundKey) {
    super();
    this.soundKey = soundKey;
  }

  async init() {
    // Load asynchronously
    //console.log("SoundElement init:", this.soundKey);
    const sound = await getSound(this.soundKey);
    this.sound = sound;
    await super.init();
  }

  playSound() {
    //console.log("SoundElement play:", this.soundKey, this.sound);
    if (this.sound) {
      this.sound.volume = this.baseVolume * this.masterVolume;
      this.sound.loop = this.loop;
      // Forward the 'ended' event from HTMLAudioElement
      this.sound.addEventListener(
        "ended",
        () => {
          this.dispatchEvent(new Event("ended"));
        },
        { once: true }
      );
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

  finish(): void {
    this.stopSound();
    super.finish();
  }

  onSettingsChanged(settings: OverlaySettings): void {
    // Handle volume changes
    this.masterVolume = settings.masterVolume;
    if (this.sound) {
      this.sound.volume = this.baseVolume * this.masterVolume;
    }

    // Handle pause/resume
    if (settings.paused) {
      // Going into pause
      if (this.sound && !this.sound.paused) {
        this.wasPlayingBeforePause = true;
        this.sound.pause();
      }
    } else {
      // Coming out of pause
      if (this.wasPlayingBeforePause && this.sound) {
        this.sound.play();
        this.wasPlayingBeforePause = false;
      }
    }
  }
}
