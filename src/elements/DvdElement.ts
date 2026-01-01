import { ImageElement } from "./ImageElement";
import { SoundElement } from "./SoundElement";
import { ScreenBounceBehavior } from "../behaviors/ScreenBounceBehavior";
import { ScreenCornerDetectionBehavior } from "../behaviors/ScreenCornerDetectionBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { pickRandomByWeight } from "../utils/random";
import { getCanvasConfig } from "../config";
import type { ImageKey, SoundKey } from "../core/resources";
import type { LifecycleState } from "../utils/types";
import { ElementWithChildren } from "./ElementWithChildren";
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
export class DvdElement extends ElementWithChildren {
  private sizeX = 128;
  private sizeY = 56;

  constructor() {
    super();
  }

  async init(): Promise<void> {
    const { W, H } = getCanvasConfig();

    // Pick a random DVD option
    const option = pickRandomByWeight(
      DVD_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      }))
    );

    const image = new ImageElement(option.imageKey);
    const sound = new SoundElement(option.soundKey);
    sound.baseVolume = 0.4;

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

    this.children.push(image, sound);
    this.children.forEach((child) => child.init());
    await Promise.all([...this.children.map((c) => c.ready())]);
    this.state = "READY";
  }

  override onPlay(): void {
    const { W, H } = getCanvasConfig();

    this.state = "PLAYING";

    // Scale and position the DVD
    this.getChildrenOfType(ImageElement).forEach((image) => {
      image.scaleX = this.sizeX / image.getWidth();
      image.scaleY = this.sizeY / image.getHeight();
      image.x = Math.random() * (W - image.getWidth());
      image.y = Math.random() * (H - image.getHeight());
      image.onPlay();
      image.setState("PLAYING");
    });

    this.getChildrenOfType(SoundElement).forEach((sound) => {
      sound.setState("PLAYING");
      sound.onPlay();
    });
  }

  override update(deltaTime: number): void {
    if (this.state !== "PLAYING") return;
    super.update(deltaTime);
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.state !== "PLAYING") return;
    super.draw(ctx);
  }

  override onFinish(): void {
    this.state = "FINISHED";
    super.onFinish();
  }

  private onCornerReached(): void {
    // Don't set FINISHED yet - wait for sound to complete
    this.getChildrenOfType(SoundElement).forEach((sound) => {
      sound.addEventListener(
        "ended",
        () => {
          this.state = "FINISHED";
        },
        { once: true }
      );
      sound.play();
    });
  }

  override onSettingsChanged(settings: OverlaySettings): void {
    super.onSettingsChanged(settings);
  }
}
