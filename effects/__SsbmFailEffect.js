import { BaseEffect } from "./BaseEffect.js";
import { ImageElement } from "../elements/ImageElement.js";
import { SoundElement } from "../elements/SoundElement.js";
import { ImageCenteredBehavior } from "../behaviors/__ImageCenteredBehavior.js";
import { ImageFadeInOutBehavior } from "../behaviors/__ImageFadeInOutBehavior.js";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior.js";

export class SsbmFailEffect extends BaseEffect {
  constructor({ W, H, duration = 3000 }) {
    super({ W, H, duration });

    // Create image element with behaviors
    const image = ImageElement.fromImage("ssbmFailure");
    image.addBehavior(new ImageCenteredBehavior());
    image.addBehavior(new ImageFadeInOutBehavior({ fadeTime: 0.25 }));

    // Create sound element with behavior
    const sound = new SoundElement("ssbmFail");
    sound.addBehavior(new SoundOnPlayBehavior());

    // Add elements to the effect
    this.addElement(image);
    this.addElement(sound);
  }
}
