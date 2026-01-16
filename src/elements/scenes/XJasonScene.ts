import { SceneElement } from "./SceneElement";
import { SoundElement } from "../SoundElement";
import { BlurInOutBehavior } from "../behaviors/BlurInOutBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { JitterBehavior } from "../behaviors/JitterBehavior";
import { SchedulerElement } from "../SchedulerElement";
import { getRandomInRange, pickRandomByWeight } from "../../utils/random";
import type { Range } from "../../utils/random";
import { localImages } from "../../core/resources";
import { ImageElement } from "../ImageElement";

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
  //private readonly imageWidth = 560;
  //private readonly imageHeight = 120;

  constructor() {
    super();
    this.duration = 70000; // heavyrain-jason.mp3 is ~70 seconds

    this.addChild(
      new SchedulerElement({
        interval: this.imageIntervalRange,
        onTick: () => this.trySpawnPopup(),
      })
    );
  }

  override async init(): Promise<void> {
    const sound = new SoundElement("heavyRainJason");
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
      }))
    );

    //const popup = new TimedImageElement(option.imageKey, duration);
    const popup = new ImageElement({ imageUrl: option.imageUrl });
    popup.setDuration(duration);

    await popup.init();

    const width = getRandomInRange(this.imageWidthRange);
    popup.setScale(width / popup.getWidth());
    //popup.setScale(this.imageHeight / (popup.getHeight() ?? 1));
    popup.x = Math.random() * (this.W - popup.getWidth());
    popup.y = Math.random() * (this.H - popup.getHeight());

    const imageBlurConfig = { fadeTime: 0.4, maxBlur: 16 };
    popup.addChild(new JitterBehavior({ jitterAmount: 6 }));
    popup.addChild(new FadeInOutBehavior({ fadeTime: 0.4 }));
    popup.addChild(new BlurInOutBehavior(imageBlurConfig));

    this.addChild(popup);
    // Manually trigger play for dynamically spawned children
    //popup.play();
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
  }
}
