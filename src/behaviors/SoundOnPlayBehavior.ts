import { SoundElement } from "../elements/SoundElement";
import { Behavior } from "./Behavior";

export class SoundOnPlayBehavior extends Behavior {
  onPlay(soundElement: SoundElement) {
    if (soundElement.play && typeof soundElement.play === "function") {
      soundElement.play();
    }
  }
}
