import { SceneElement } from "./SceneElement";
import { ImageElement } from "../ImageElement";
import { SoundElement } from "../SoundElement";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import type { ImageKey, SoundKey } from "../../core/resources";

interface ConvergingCfg {
  duration?: number;
  leftImageKey: ImageKey;
  rightImageKey: ImageKey;
  soundKey?: SoundKey;
  scale?: number;
  fadeTime?: number;
}

export class ConvergingSlideScene extends SceneElement {
  private cfg: ConvergingCfg;
  private leftImage: ImageElement | null = null;
  private rightImage: ImageElement | null = null;
  private soundElement: SoundElement | null = null;

  private scale: number;
  private fadeTime: number;

  static createBamSuccess(): ConvergingSlideScene {
    return new ConvergingSlideScene({
      leftImageKey: "bubSuccess",
      rightImageKey: "bobSuccess",
      soundKey: "bamHooray",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }

  static createBamFailure(): ConvergingSlideScene {
    return new ConvergingSlideScene({
      leftImageKey: "bubFailure",
      rightImageKey: "bobFailure",
      soundKey: "bamUhOh",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }

  constructor(cfg: ConvergingCfg) {
    super();
    this.cfg = cfg;
    this.scale = cfg.scale ?? 0.25;
    this.fadeTime = cfg.fadeTime ?? 0.2;
  }

  override async init(): Promise<void> {
    this.leftImage = new ImageElement(this.cfg.leftImageKey);
    this.leftImage.setScale(this.scale);
    this.addChild(this.leftImage);

    this.rightImage = new ImageElement(this.cfg.rightImageKey);
    this.rightImage.setScale(this.scale);
    this.addChild(this.rightImage);

    if (this.cfg.soundKey) {
      this.soundElement = new SoundElement(this.cfg.soundKey);
      this.soundElement.addChild(new SoundOnPlayBehavior());
      this.addChild(this.soundElement);
    }

    if (this.cfg.duration) {
      this.duration = this.cfg.duration;
    }

    await super.init();
  }

  override play(): void {
    if (this.cfg.duration) {
      this.duration = this.cfg.duration;
    } else if (this.soundElement?.sound) {
      this.duration = this.soundElement.sound.duration * 1000;
    } else {
      this.duration = 4500;
    }

    this.setSlideBehaviors();
    super.play();
  }

  private setSlideBehaviors(): void {
    if (this.leftImage && this.leftImage.image) {
      this.leftImage.addChild(
        new TranslateBehavior({
          startX: 0 - this.leftImage.getWidth(),
          startY: this.H,
          endX: 0,
          endY: this.H - this.leftImage.getHeight(),
          fadeTime: this.fadeTime,
        })
      );
    }

    if (this.rightImage && this.rightImage.image) {
      this.rightImage.addChild(
        new TranslateBehavior({
          startX: this.W,
          startY: this.H,
          endX: this.W - this.rightImage.getWidth(),
          endY: this.H - this.rightImage.getHeight(),
          fadeTime: this.fadeTime,
        })
      );
    }
  }
}
