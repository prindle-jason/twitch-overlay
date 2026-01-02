import { Element } from "../Element";
import { SoundElement } from "../SoundElement";

interface SoundOnFinishConfig {
  volume?: number;
}

export class SoundOnFinishBehavior extends Element {
  private volume: number;

  constructor(config: SoundOnFinishConfig = {}) {
    super();
    this.volume = config.volume ?? 1.0;
  }

  private get target(): SoundElement | null {
    return this.parent instanceof SoundElement ? this.parent : null;
  }

  override finish(): void {
    const soundElement = this.target;
    if (soundElement?.sound) {
      soundElement.sound.volume = this.volume;
      soundElement.sound.play();
    }

    super.finish();
  }
}
