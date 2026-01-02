import { SoundElement } from "../elements/SoundElement";
import { Behavior } from "./Behavior";

export class SoundOnPlayBehavior extends Behavior {
  play(soundElement: SoundElement) {
    console.log("SoundOnPlayBehavior play:", soundElement.soundKey);
    soundElement.playSound();
  }
}
