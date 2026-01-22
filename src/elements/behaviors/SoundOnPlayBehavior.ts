import { Element } from "../primitives/Element";
import { SoundElement } from "../primitives/SoundElement";

export class SoundOnPlayBehavior extends Element {
  private get target(): SoundElement | null {
    return this.parent instanceof SoundElement ? this.parent : null;
  }

  override play(): void {
    super.play();
    this.target?.playSound();
  }
}
