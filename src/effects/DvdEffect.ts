import { Effect } from "./Effect";
import { ImageElement } from "../elements/ImageElement";
import { SoundElement } from "../elements/SoundElement";
import { ScreenBounceBehavior } from "../behaviors/ScreenBounceBehavior";
import { ScreenCornerDetectionBehavior } from "../behaviors/ScreenCornerDetectionBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { SoundOnFinishBehavior } from "../behaviors/SoundOnFinishBehavior";
import { pickRandomByWeight } from "../utils/random";
import type { ImageKey, SoundKey } from "../core/resources";

interface DvdOption {
  weight: number;
  imageKey: ImageKey;
  soundKey: SoundKey;
}

const DVD_OPTIONS: readonly DvdOption[] = [
  { weight: 9, imageKey: "dvdLogo", soundKey: "partyHorn" },
  { weight: 1, imageKey: "bluRayLogo", soundKey: "yippee" },
];

interface DvdConfig {
  duration?: number;
  spawnEffect?: (type: string) => void;
}

/* This effect displays a DVD logo that bounces around the screen,
   and uses a callback to spawn another effect when it hits a corner.

   It might be better if this effect could spawn another effect directly,
   but for now we'll use a callback to the EffectManager to keep things simple.
*/
export class DvdEffect extends Effect {
  private cornerDetector!: ScreenCornerDetectionBehavior;
  private spawnEffect?: (type: string) => void;

  private image!: ImageElement;
  private sound!: SoundElement;

  private sizeX = 128;
  private sizeY = 56;

  constructor(cfg: DvdConfig = {}) {
    super();
    this.duration = cfg.duration ?? -1; // Infinite until corner hit
    this.spawnEffect = cfg.spawnEffect ?? undefined;
  }

  override async init(): Promise<void> {
    const option = pickRandomByWeight(
      DVD_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      }))
    );

    this.image = new ImageElement(option.imageKey);

    const velocity = Math.random() + 2;
    const bounceBehavior = new ScreenBounceBehavior({
      screenWidth: this.W,
      screenHeight: this.H,
      velocityX: Math.random() < 0.5 ? -velocity : velocity,
      velocityY: Math.random() < 0.5 ? -velocity : velocity,
    });

    this.cornerDetector = new ScreenCornerDetectionBehavior({
      screenWidth: this.W,
      screenHeight: this.H,
      epsilon: 2,
    });

    const hueCycleBehavior = new HueCycleBehavior({
      hueIncrement: 0.5,
    });

    this.image.addBehavior(bounceBehavior);
    this.image.addBehavior(this.cornerDetector);
    this.image.addBehavior(hueCycleBehavior);

    this.addElement(this.image);

    this.sound = new SoundElement(option.soundKey);
    this.sound.addBehavior(new SoundOnFinishBehavior({ volume: 0.4 }));
    this.addElement(this.sound);

    await super.init();
  }

  override onPlay(): void {
    this.image.scaleX = this.sizeX / this.image.getWidth();
    this.image.scaleY = this.sizeY / this.image.getHeight();

    this.image.x = Math.random() * (this.W - this.image.getWidth());
    this.image.y = Math.random() * (this.H - this.image.getHeight());

    super.onPlay();
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);

    if (this.cornerDetector.cornerReached) {
      this.state = "FINISHED";
    }
  }

  override onFinish(): void {
    if (this.spawnEffect) {
      this.spawnEffect("confetti");
    }

    super.onFinish();
  }
}
