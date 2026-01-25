import { SceneElement } from "./SceneElement";
import { SoundElement } from "../primitives/SoundElement";
import { BlurInOutBehavior } from "../behaviors/BlurInOutBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { JitterBehavior } from "../behaviors/JitterBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import { getRandomInRange, pickRandomByWeight } from "../../utils/random";
import type { Range } from "../../utils/random";
import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";
import { ImageElement } from "../primitives/ImageElement";

interface ImageOption {
  weight: number;
  imageUrl: string;
}

const IMAGE_OPTIONS: readonly ImageOption[] = [
  { weight: 97, imageUrl: localImages.xJason },
  { weight: 3, imageUrl: localImages.xHello },
];

/** Plays an audio file while spawning images around the screen */
export class XJasonScene extends SceneElement {
  readonly type = "xJason" as const;
  private readonly imageIntervalRange: Range = { min: 300, max: 1000 };
  private readonly imageDurationRange: Range = { min: 1200, max: 1600 };
  private readonly imageWidthRange: Range = { min: 250, max: 1500 };

  constructor() {
    super();
    this.duration = 70000; // heavyrain-jason.mp3 is ~70 seconds

    this.addChild(
      new SchedulerElement({
        interval: this.imageIntervalRange,
        onTick: () => this.trySpawnPopup(),
      }),
    );
  }

  override async init(): Promise<void> {
    const sound = new SoundElement(localSounds.heavyRainJason);
    sound.addChild(new SoundOnPlayBehavior());
    this.addChild(sound);

    await super.init();
  }

  private trySpawnPopup(): void {
    const effectTimeRemaining = this.duration - this.elapsed;
    const newPopupDuration = getRandomInRange(this.imageDurationRange);

    if (effectTimeRemaining >= newPopupDuration) {
      this.spawnPopup();
    }
  }

  private async spawnPopup(): Promise<void> {
    const duration = getRandomInRange(this.imageDurationRange);

    const option = pickRandomByWeight(
      IMAGE_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      })),
    );

    const popup = new ImageElement({
      imageUrl: option.imageUrl,
      width: getRandomInRange(this.imageWidthRange),
      scaleStrategy: "fit",
      duration: duration,
    });

    const imageBlurConfig = { fadeTime: 0.4, maxBlur: 16 };
    popup.addChild(new JitterBehavior({ jitterAmount: 6 }));
    popup.addChild(new FadeInOutBehavior({ fadeTime: 0.4 }));
    popup.addChild(new BlurInOutBehavior(imageBlurConfig));

    await popup.init();

    popup.x = Math.random() * (this.W - popup.getWidth()!);
    popup.y = Math.random() * (this.H - popup.getHeight()!);

    this.addChild(popup);
  }
}
