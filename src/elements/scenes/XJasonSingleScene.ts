import { SceneElement } from "./SceneElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { BlurInOutBehavior } from "../behaviors/BlurInOutBehavior";
import { JitterBehavior } from "../behaviors/JitterBehavior";
import { getRandomInRange } from "../../utils/random";
import type { Range } from "../../utils/random";
import { localImages } from "../../utils/assets/images";
import { soundFolders } from "../../utils/assets/sounds";
import { ImageElement } from "../primitives/ImageElement";

/** Plays a single random sound from the xJason folder while showing one xJason image */
export class XJasonSingleScene extends SceneElement {
  readonly type = "xJasonSingle" as const;
  private readonly imageWidthRange: Range = { min: 250, max: 1500 };
  private readonly imageDurationRange: Range = { min: 1200, max: 1600 };
  private image: ImageElement | null = null;

  constructor() {
    super();
    this.duration = 3000;
  }

  override async init(): Promise<void> {
    const sound = new SoundElement(soundFolders.xJasonRandom);
    sound.addChild(new SoundOnPlayBehavior());
    this.addChild(sound);

    this.image = new ImageElement({
      imageUrl: localImages.xJason,
      width: getRandomInRange(this.imageWidthRange),
      scaleStrategy: "fit",
      duration: getRandomInRange(this.imageDurationRange),
    });

    this.image.addChild(new JitterBehavior({ jitterAmount: 6 }));
    this.image.addChild(new FadeInOutBehavior({ fadeTime: 0.4 }));
    this.image.addChild(new BlurInOutBehavior({ fadeTime: 0.4, maxBlur: 16 }));
    
    this.addChild(this.image);

    await super.init();
  }

  override play(): void {
    if (this.image) {
      this.image.x = Math.random() * (this.W - this.image.getWidth()!);
      this.image.y = Math.random() * (this.H - this.image.getHeight()!);
    }

    super.play();
  }
}
