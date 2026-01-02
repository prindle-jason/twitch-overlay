import { Element } from "../Element";
import { SoundElement } from "../SoundElement";

export class SoundOnPlayBehavior extends Element {
  private get target(): SoundElement | null {
    return this.parent instanceof SoundElement ? this.parent : null;
  }

  override play(): void {
    super.play();
    this.target?.playSound();
  }
}
