import { ImageElement } from "./ImageElement";
import { SoundElement } from "./SoundElement";
import { ScreenBounceBehavior } from "./behaviors/ScreenBounceBehavior";
import { ScreenCornerDetectionBehavior } from "./behaviors/ScreenCornerDetectionBehavior";
import { HueCycleBehavior } from "./behaviors/HueCycleBehavior";
import { pickRandomByWeight } from "../utils/random";
import { calculateScaleForMax } from "../utils/dimensionUtils";
import { getCanvasConfig } from "../config";
import { localImages, type ImageKey, type SoundKey } from "../core/resources";
import { Element } from "./Element";

interface DvdOption {
  weight: number;
  imageUrl: string;
  soundKey: SoundKey;
}

const DVD_OPTIONS: readonly DvdOption[] = [
  { weight: 175, imageUrl: localImages.dvdLogo, soundKey: "partyHorn" },
  { weight: 19, imageUrl: localImages.bluRayLogo, soundKey: "yippee" },
  { weight: 5, imageUrl: localImages.netflixLogo, soundKey: "netflixSound" },
  { weight: 1, imageUrl: localImages.thxLogo, soundKey: "thxSound" },
];

/**
 * DvdElement represents a single logo bouncing around the screen.
 * It contains both the image and sound, and manages its own lifecycle.
 */
export class DvdElement extends Element {
  // Limits the maximum width/height of the logo while maintaining aspect ratio
  private maxSize = 128;
  private imageElement!: ImageElement;
  private soundElement!: SoundElement;
  private hasHitCorner = false;

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

    this.soundElement = new SoundElement(option.soundKey);
    this.soundElement.baseVolume = 0.4;
    this.addChild(this.soundElement);
    await super.init();
  }

  getHasHitCorner(): boolean {
    return this.hasHitCorner;
  }

  setMaxSize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    this.updateDimensions();
  }

  private updateDimensions(): void {
    const scale = calculateScaleForMax(
      this.imageElement.getWidth(),
      this.imageElement.getHeight(),
      this.maxSize
    );
    this.imageElement.setScale(scale);
  }

  play(): void {
    const { W, H } = getCanvasConfig();

    this.updateDimensions();
    this.imageElement.x = Math.random() * (W - this.imageElement.getWidth());
    this.imageElement.y = Math.random() * (H - this.imageElement.getHeight());

    super.play();
  }

  private createImage(option: DvdOption): void {
    const { W, H } = getCanvasConfig();
    this.imageElement = new ImageElement({ imageUrl: option.imageUrl });

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

    const hueCycleBehavior = new HueCycleBehavior();

    this.imageElement.addChild(bounceBehavior);
    this.imageElement.addChild(cornerDetector);
    this.imageElement.addChild(hueCycleBehavior);

    this.addChild(this.imageElement);
  }

  private onCornerReached(): void {
    if (this.hasHitCorner) {
      return;
    }

    this.hasHitCorner = true;
    this.imageElement.finish();

    this.soundElement.addEventListener(
      "ended",
      () => {
        this.finish();
      },
      { once: true }
    );
    this.soundElement.playSound();
  }
}
