import { ImageElement } from "./ImageElement";
import { SoundElement } from "./SoundElement";
import { ScreenBounceBehavior } from "../behaviors/ScreenBounceBehavior";
import { ScreenCornerDetectionBehavior } from "../behaviors/ScreenCornerDetectionBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { pickRandomByWeight } from "../utils/random";
import { getCanvasConfig } from "../config";
import type { ImageKey, SoundKey } from "../core/resources";
import type { LifecycleState } from "../utils/types";
import { Element } from "./Element";
import { OverlaySettings } from "../core/OverlaySettings";

interface DvdOption {
  weight: number;
  imageKey: ImageKey;
  soundKey: SoundKey;
}

const DVD_OPTIONS: readonly DvdOption[] = [
  { weight: 9, imageKey: "dvdLogo", soundKey: "partyHorn" },
  { weight: 1, imageKey: "bluRayLogo", soundKey: "yippee" },
];

/**
 * DvdElement represents a single DVD logo bouncing around the screen.
 * It contains both the image and sound, and manages its own lifecycle.
 */
export class DvdElement extends Element {
  private sizeX = 128;
  private sizeY = 56;

  constructor() {
    super();
  }

  async init(): Promise<void> {
    // Pick a random DVD option
    const option = pickRandomByWeight(
      DVD_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      }))
    );

    this.createImage(option);

    const sound = new SoundElement(option.soundKey);
    sound.baseVolume = 0.4;
    this.addChild(sound);
    await super.init();
  }

  play(): void {
    const { W, H } = getCanvasConfig();
    this.getChildrenOfType(ImageElement).forEach((image) => {
      image.scaleX = this.sizeX / image.getWidth();
      image.scaleY = this.sizeY / image.getHeight();
      image.x = Math.random() * (W - image.getWidth());
      image.y = Math.random() * (H - image.getHeight());

      super.play();
    });
  }

  private createImage(option: DvdOption): void {
    const { W, H } = getCanvasConfig();
    const image = new ImageElement(option.imageKey);

    const velocity = Math.random() + 2;
    const bounceBehavior = new ScreenBounceBehavior({
      screenWidth: W,
      screenHeight: H,
      velocityX: Math.random() < 0.5 ? -velocity : velocity,
      velocityY: Math.random() < 0.5 ? -velocity : velocity,
    });

    const cornerDetector = new ScreenCornerDetectionBehavior({
      screenWidth: W,
      screenHeight: H,
      epsilon: 2,
      onCornerReached: () => this.onCornerReached(),
    });

    const hueCycleBehavior = new HueCycleBehavior({
      hueIncrement: 0.5,
    });

    image.addBehavior(bounceBehavior);
    image.addBehavior(cornerDetector);
    image.addBehavior(hueCycleBehavior);

    this.addChild(image);
  }

  private onCornerReached(): void {
    this.getChildrenOfType(ImageElement).forEach((image) => {
      image.finish();
    });

    this.getChildrenOfType(SoundElement).forEach((sound) => {
      sound.addEventListener(
        "ended",
        () => {
          this.finish();
        },
        { once: true }
      );
      sound.playSound();
    });
  }
}
