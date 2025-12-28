import { Element } from "./Element";
import { getSound, type SoundKey } from "../core/resources";

export class SoundElement extends Element {
  soundKey: SoundKey;
  sound: HTMLAudioElement | null = null;
  private loadPromise: Promise<void> | null = null;
  volume = 1;
  loop = false;

  constructor(soundKey: SoundKey) {
    super();
    this.soundKey = soundKey;
  }

  init() {
    // Load asynchronously; ready() will await it
    console.log("SoundElement init:", this.soundKey);
    this.loadPromise = getSound(this.soundKey).then((audio) => {
      this.sound = audio;
    });
  }

  async ready(): Promise<void> {
    if (this.loadPromise) {
      await this.loadPromise;
    }
    console.log("SoundElement ready:", this.soundKey);
    this.state = "READY";
  }

  play() {
    if (this.sound) {
      this.sound.volume = this.volume;
      this.sound.loop = this.loop;
      this.sound.play();
    }
  }

  stop() {
    if (this.sound) {
      this.sound.pause();
      this.sound.currentTime = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // No-op for sound
  }
}
