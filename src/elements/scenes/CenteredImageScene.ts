import { SceneElement } from "./SceneElement";
import { SoundElement } from "../SoundElement";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { type SoundKey, localImages } from "../../core/resources";
import { ImageElement } from "../ImageElement";
import type { PoolType } from "../../utils/types";

interface CenteredImageSceneCfg {
  imageUrl: string;
  soundKey?: SoundKey;
  duration?: number;
  fadeTime?: number;
}

abstract class CenteredImageScene extends SceneElement {
  private cfg: CenteredImageSceneCfg;
  private image: ImageElement | null = null;
  private soundElement: SoundElement | null = null;
  private fadeTime: number;

  constructor(cfg: CenteredImageSceneCfg) {
    super();
    this.cfg = cfg;
    this.fadeTime = cfg.fadeTime ?? 0.25;
  }

  override async init(): Promise<void> {
    this.image = new ImageElement({ imageUrl: this.cfg.imageUrl });
    this.image.addChild(new FadeInOutBehavior({ fadeTime: this.fadeTime }));
    this.addChild(this.image);

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
    this.image!.x = (this.W - this.image!.getWidth()) / 2;
    this.image!.y = (this.H - this.image!.getHeight()) / 2;

    if (this.cfg.duration) {
      this.duration = this.cfg.duration;
    } else {
      this.duration = 5000;
    }

    super.play();
  }

  override finish(): void {
    super.finish();
    // Clear element references to prevent memory leaks
    this.image = null;
    this.soundElement = null;
  }
}

/** SSBM Success scene variant - triggered by "ssbmSuccess" or "success" pools */
export class SsbmSuccessScene extends CenteredImageScene {
  readonly type = "ssbmSuccess" as const;
  static readonly poolIds: readonly PoolType[] = ["success"];

  constructor() {
    super({
      imageUrl: localImages.ssbmSuccess,
      soundKey: "ssbmSuccess",
      fadeTime: 0.25,
    });
  }
}

/** SSBM Fail scene variant - triggered by "ssbmFail" or "failure" pools */
export class SsbmFailScene extends CenteredImageScene {
  readonly type = "ssbmFail" as const;
  static readonly poolIds: readonly PoolType[] = ["failure"];

  constructor() {
    super({
      imageUrl: localImages.ssbmFailure,
      soundKey: "ssbmFail",
      fadeTime: 0.25,
    });
  }
}
