import { SceneElement } from "../SceneElement";
import { SoundElement } from "../../primitives/SoundElement";
import { TranslateBehavior } from "../../behaviors/TranslateBehavior";
import { SoundOnPlayBehavior } from "../../behaviors/SoundOnPlayBehavior";
import { localImages } from "../../../utils/assets/images";
import { localSounds } from "../../../utils/assets/sounds";
import { ImageElement } from "../../primitives/ImageElement";
import type { PoolType } from "../../../types/SceneTypes";

interface ConvergingCfg {
  duration?: number;
  bottomLeftImageUrl: string;
  bottomRightImageUrl: string;
  soundUrl?: string;
  scale?: number;
  fadeTime?: number;
}

abstract class ConvergingSlideScene extends SceneElement {
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
    this.addChild(this.bottomLeftImage);

    this.bottomRightImage = new ImageElement({
      imageUrl: this.cfg.bottomRightImageUrl,
      scale: this.scale,
    });
    this.addChild(this.bottomRightImage);

    if (this.cfg.soundUrl) {
      this.soundElement = new SoundElement(this.cfg.soundUrl);
      this.soundElement.addChild(new SoundOnPlayBehavior());
      this.addChild(this.soundElement);
    }

    if (this.cfg.duration) {
      this.duration = this.cfg.duration;
    }

    await super.init();
  }

  override play(): void {
    this.setSlideBehaviors();
    super.play();
  }

  private setSlideBehaviors(): void {
    if (this.bottomLeftImage) {
      this.bottomLeftImage.addChild(
        new TranslateBehavior({
          startX: 0 - this.bottomLeftImage.getWidth()!,
          startY: this.H,
          endX: 0,
          endY: this.H - this.bottomLeftImage.getHeight()!,
          fadeTime: this.fadeTime,
        }),
      );
    }

    if (this.bottomRightImage) {
      this.bottomRightImage.addChild(
        new TranslateBehavior({
          startX: this.W,
          startY: this.H,
          endX: this.W - this.bottomRightImage.getWidth()!,
          endY: this.H - this.bottomRightImage.getHeight()!,
          fadeTime: this.fadeTime,
        }),
      );
    }
  }

  override finish(): void {
    super.finish();
    // Clear element references to prevent memory leaks
    this.bottomLeftImage = null;
    this.bottomRightImage = null;
    this.soundElement = null;
  }
}

/** Bam Success scene variant - triggered by "bamSuccess" or "success" pools */
export class BamSuccessScene extends ConvergingSlideScene {
  readonly type = "bamSuccess" as const;
  static readonly poolIds: readonly PoolType[] = ["success"];

  constructor() {
    super({
      bottomLeftImageUrl: localImages.bubSuccess,
      bottomRightImageUrl: localImages.bobSuccess,
      soundUrl: localSounds.bamHooray,
      scale: 0.25,
      fadeTime: 0.2,
      duration: 5000,
    });
  }
}

/** Bam Failure scene variant - triggered by "bamUhOh" or "failure" pools */
export class BamFailureScene extends ConvergingSlideScene {
  readonly type = "bamUhOh" as const;
  static readonly poolIds: readonly PoolType[] = ["failure"];

  constructor() {
    super({
      bottomLeftImageUrl: localImages.bubFailure,
      bottomRightImageUrl: localImages.bobFailure,
      soundUrl: localSounds.bamUhOh,
      scale: 0.25,
      fadeTime: 0.2,
      duration: 6500,
    });
  }
}
