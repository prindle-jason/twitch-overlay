import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { ScreenBounceBehavior } from "../behaviors/ScreenBounceBehavior";
import { ScreenCornerDetectionBehavior } from "../behaviors/ScreenCornerDetectionBehavior";
import { HueCycleBehavior } from "../behaviors/HueCycleBehavior";
import { pickRandomByWeight } from "../../utils/random";
import { configProps } from "../../core/configProps";
import { EventBus } from "../../core/EventBus";
import { Element } from "../primitives/Element";
import {
  DEFAULT_DVD_CORNER_HIT_EFFECT,
  DVD_OPTIONS,
  type DvdCornerHitEffect,
  type DvdOption,
  type DvdType,
} from "./dvdOptions";

/**
 * DvdElement represents a single logo bouncing around the screen.
 * It contains both the image and sound, and manages its own lifecycle.
 */
export class DvdElement extends Element {
  // Limits the maximum width/height of the logo while maintaining aspect ratio
  private maxSize = 100;
  private cornerHitEffect!: DvdCornerHitEffect;
  private imageElement!: ImageElement;
  private soundElement: SoundElement | null = null;
  private hasHitCorner = false;
  private requestedType?: DvdType;
  private handleSoundEnded = (): void => {
    this.soundElement?.offEnded(this.handleSoundEnded);
    this.finish();
  };

  constructor(requestedType?: DvdType) {
    super({ duration: 30 * 60 * 1000 });
    this.requestedType = requestedType;
  }

  async init(): Promise<void> {
    const option = this.pickOption();

    this.cornerHitEffect =
      option.cornerHitEffect ?? DEFAULT_DVD_CORNER_HIT_EFFECT;

    this.createImage(option);

    if (this.cornerHitEffect.kind === "sound") {
      this.soundElement = new SoundElement(this.cornerHitEffect.soundUrl);
      this.soundElement.baseVolume = 0.4;
      this.addChild(this.soundElement);
    }
    await super.init();
  }

  private pickOption(): DvdOption {
    if (this.requestedType) {
      const matched = DVD_OPTIONS.find(
        (option) => option.type === this.requestedType,
      );
      if (matched) {
        return matched;
      }
    }

    return pickRandomByWeight(
      DVD_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      })),
    );
  }

  getHasHitCorner(): boolean {
    return this.hasHitCorner;
  }

  getCornerHitEffect(): DvdCornerHitEffect {
    return this.cornerHitEffect;
  }

  play(): void {
    const { W, H } = configProps.canvas;

    this.imageElement.x = Math.random() * (W - this.imageElement.getWidth()!);
    this.imageElement.y = Math.random() * (H - this.imageElement.getHeight()!);

    super.play();
  }

  private createImage(option: DvdOption): void {
    const { W, H } = configProps.canvas;
    const maxSize = option.maxSize ?? this.maxSize;
    this.imageElement = new ImageElement({
      imageUrl: option.imageUrl,
      width: maxSize,
      height: maxSize,
      scaleStrategy: "fit",
    });

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

    EventBus.emit("dvd-hit-corner", {
      ctor: this.constructor.name,
      instance: this,
    });

    if (this.cornerHitEffect.kind !== "sound" || !this.soundElement) {
      this.finish();
      return;
    }

    this.soundElement.onEnded(this.handleSoundEnded);
    this.soundElement.playSound();
  }

  override finish(): void {
    if (this.soundElement) {
      this.soundElement.offEnded(this.handleSoundEnded);
    }

    super.finish();

    // Clear element references to prevent memory leaks
    this.imageElement = null as any;
    this.soundElement = null as any;
  }
}
