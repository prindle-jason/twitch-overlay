import { SceneElement } from "./SceneElement";
import { TimedImageElement } from "../TimedImageElement";
import { SoundElement } from "../SoundElement";
import { ImageBlurInOutBehavior } from "../../behaviors/ImageBlurInOutBehavior";
import { SoundOnPlayBehavior } from "../../behaviors/SoundOnPlayBehavior";
import { ImageFadeInOutBehavior } from "../../behaviors/ImageFadeInOutBehavior";
import { ImageJitterBehavior } from "../../behaviors/ImageJitterBehavior";
import { IntervalRangeTimer } from "../../utils/IntervalRangeTimer";
import { getRandomInRange, pickRandomByWeight } from "../../utils/random";
import type { Range } from "../../utils/random";
import { ImageKey } from "../../core/resources";

interface ImageOption {
  weight: number;
  imageKey: ImageKey;
}

const IMAGE_OPTIONS: readonly ImageOption[] = [
  { weight: 97, imageKey: "xJason" },
  { weight: 3, imageKey: "xHello" },
];

/** Plays an audio file while spawning images around the screen */
export class XJasonScene extends SceneElement {
  private readonly imageIntervalRange: Range = { min: 500, max: 900 };
  private readonly imageDurationRange: Range = { min: 1200, max: 1600 };
  private readonly imageWidth = 560;
  private readonly imageHeight = 120;

  private spawner: IntervalRangeTimer;

  constructor() {
    super();
    this.duration = 70000; // heavyrain-jason.mp3 is ~70 seconds

    this.spawner = new IntervalRangeTimer(
      this.imageIntervalRange.min,
      this.imageIntervalRange.max,
      () => this.trySpawnPopup()
    );
  }

  override async init(): Promise<void> {
    const sound = new SoundElement("heavyRainJason");
    sound.addBehavior(new SoundOnPlayBehavior());
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

  private spawnPopup(): void {
    const duration = getRandomInRange(this.imageDurationRange);

    const option = pickRandomByWeight(
      IMAGE_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      }))
    );

    const popup = new TimedImageElement(option.imageKey, duration);

    popup.init();

    popup.x = Math.random() * (this.W - this.imageWidth);
    popup.y = Math.random() * (this.H - this.imageHeight);

    const imageBlurConfig = { fadeTime: 0.4, maxBlur: 16 };
    popup.addBehavior(new ImageJitterBehavior({ jitterAmount: 6 }));
    popup.addBehavior(new ImageFadeInOutBehavior(0.4));
    popup.addBehavior(new ImageBlurInOutBehavior(imageBlurConfig));

    this.addChild(popup);
    // Manually trigger play for dynamically spawned children
    popup.play();
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    this.spawner.update(deltaTime);

    // Remove expired popups
    this.children = this.children.filter((child) => {
      if (child instanceof TimedImageElement && child.expired) {
        child.setParent(null);
        return false;
      }
      return true;
    });
  }
}
