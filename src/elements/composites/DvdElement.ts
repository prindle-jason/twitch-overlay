import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { ScreenBounceBehavior } from "../behaviors/ScreenBounceBehavior";
import { ScreenCornerDetectionBehavior } from "../behaviors/ScreenCornerDetectionBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { pickRandomByWeight } from "../../utils/random";
import { calculateScaleForMax } from "../../utils/dimensions";
import { configProps } from "../../core/configProps";
import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";
import { Element } from "../primitives/Element";

interface DvdOption {
  weight: number;
  imageUrl: string;
  soundUrl: string;
}

const DVD_OPTIONS: readonly DvdOption[] = [
  {
    weight: 175,
    imageUrl: localImages.dvdLogo,
    soundUrl: localSounds.partyHorn,
  },
  {
    weight: 19,
    imageUrl: localImages.bluRayLogo,
    soundUrl: localSounds.yippee,
  },
  {
    weight: 5,
    imageUrl: localImages.netflixLogo,
    soundUrl: localSounds.netflixSound,
  },
  { weight: 1, imageUrl: localImages.thxLogo, soundUrl: localSounds.thxSound },
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
      })),
    );

    this.createImage(option);

    this.soundElement = new SoundElement(option.soundUrl);
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
      this.maxSize,
    );
    this.imageElement.setScale(scale);
  }

  play(): void {
    const { W, H } = configProps.canvas;

    this.updateDimensions();
    this.imageElement.x = Math.random() * (W - this.imageElement.getWidth());
    this.imageElement.y = Math.random() * (H - this.imageElement.getHeight());

    super.play();
  }

  private createImage(option: DvdOption): void {
    const { W, H } = configProps.canvas;
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

    const audio = this.soundElement.getSound();
    if (audio) {
      audio.addEventListener(
        "ended",
        () => {
          this.finish();
        },
        { once: true },
      );
    }
    this.soundElement.playSound();
  }

  override finish(): void {
    super.finish();
    // Clear element references to prevent memory leaks
    this.imageElement = null as any;
    this.soundElement = null as any;
  }
}
