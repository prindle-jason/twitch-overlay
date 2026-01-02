import { Behavior } from "./Behavior";
import { SoundElement } from "../elements/SoundElement";

interface SoundOnFinishConfig {
  volume?: number;
}

export class SoundOnFinishBehavior extends Behavior {
  private volume: number;

  constructor(config: SoundOnFinishConfig = {}) {
    super();
    this.volume = config.volume ?? 1.0;
  }

  finish(element: SoundElement): void {
    if (element.sound) {
      element.sound.volume = this.volume;
      element.sound.play();
    }
  }
}
