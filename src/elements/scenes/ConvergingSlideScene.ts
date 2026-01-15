import { SceneElement } from "./SceneElement";
import { SoundElement } from "../SoundElement";
import { TranslateBehavior } from "../behaviors/TranslateBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { localImages, type SoundKey } from "../../core/resources";
import { ImageElement } from "../ImageElement";
import type { PoolId } from "../../utils/types";

interface ConvergingCfg {
  duration?: number;
  bottomLeftImageUrl: string;
  bottomRightImageUrl: string;
  soundKey?: SoundKey;
  scale?: number;
  fadeTime?: number;
}

class ConvergingSlideScene extends SceneElement {
  private cfg: ConvergingCfg;
  private bottomLeftImage: ImageElement | null = null;
  private bottomRightImage: ImageElement | null = null;
  private soundElement: SoundElement | null = null;

  private scale: number;
  private fadeTime: number;

  constructor(cfg: ConvergingCfg) {
    super();
    this.cfg = cfg;
    this.scale = cfg.scale ?? 0.25;
    this.fadeTime = cfg.fadeTime ?? 0.2;
  }

  override async init(): Promise<void> {
    this.bottomLeftImage = new ImageElement({
      imageUrl: this.cfg.bottomLeftImageUrl,
      scale: this.scale,
    });
    // this.bottomLeftImage = new ImageElement({
    //   imageKey: this.cfg.bottomLeftImageUrl,
    //   scale: this.scale,
    // });
    this.addChild(this.bottomLeftImage);

    // this.bottomRightUrl = new ImageElement({
    //   imageKey: this.cfg.rightImageKey,
    //   scale: this.scale,
    // });
    this.bottomRightImage = new ImageElement({
      imageUrl: this.cfg.bottomRightImageUrl,
      scale: this.scale,
    });
    this.addChild(this.bottomRightImage);

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
    if (this.bottomLeftImage) {
      this.bottomLeftImage.addChild(
        new TranslateBehavior({
          startX: 0 - this.bottomLeftImage.getWidth(),
          startY: this.H,
          endX: 0,
          endY: this.H - this.bottomLeftImage.getHeight(),
          fadeTime: this.fadeTime,
        })
      );
    }

    if (this.bottomRightImage) {
      this.bottomRightImage.addChild(
        new TranslateBehavior({
          startX: this.W,
          startY: this.H,
          endX: this.W - this.bottomRightImage.getWidth(),
          endY: this.H - this.bottomRightImage.getHeight(),
          fadeTime: this.fadeTime,
        })
      );
    }
  }
}

/** Bam Success scene variant - triggered by "bamSuccess" or "success" pools */
export class BamSuccessScene extends ConvergingSlideScene {
  static readonly poolIds: readonly PoolId[] = ["bamSuccess", "success"];

  constructor() {
    super({
      bottomLeftImageUrl: localImages.bubSuccess,
      bottomRightImageUrl: localImages.bobSuccess,
      soundKey: "bamHooray",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }
}

/** Bam Failure scene variant - triggered by "bamUhOh" or "failure" pools */
export class BamFailureScene extends ConvergingSlideScene {
  static readonly poolIds: readonly PoolId[] = ["bamUhOh", "failure"];

  constructor() {
    super({
      bottomLeftImageUrl: localImages.bubFailure,
      bottomRightImageUrl: localImages.bobFailure,
      soundKey: "bamUhOh",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }
}
