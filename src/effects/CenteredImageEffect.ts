import { Effect } from "./Effect";
import { ImageElement } from "../elements/ImageElement";
import { SoundElement } from "../elements/SoundElement";
import { ImageFadeInOutBehavior } from "../behaviors/ImageFadeInOutBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import type { ImageKey, SoundKey } from "../core/resources";

interface CenteredImageCfg {
  imageKey: ImageKey;
  soundKey?: SoundKey;
  duration?: number;
  fadeTime?: number;
}

export class CenteredImageEffect extends Effect {
  private cfg: CenteredImageCfg;
  private image: ImageElement | null = null;
  private soundElement: SoundElement | null = null;
  private fadeTime: number;

  static createSsbmSuccess(): CenteredImageEffect {
    return new CenteredImageEffect({
      imageKey: "ssbmSuccess",
      soundKey: "ssbmSuccess",
      fadeTime: 0.25,
    });
  }

  static createSsbmFail(): CenteredImageEffect {
    return new CenteredImageEffect({
      imageKey: "ssbmFailure",
      soundKey: "ssbmFail",
      fadeTime: 0.25,
    });
  }

  constructor(cfg: CenteredImageCfg) {
    super();
    this.cfg = cfg;
    this.fadeTime = cfg.fadeTime ?? 0.25;
  }

  override async init(): Promise<void> {
    this.image = new ImageElement(this.cfg.imageKey);
    this.image.addBehavior(new ImageFadeInOutBehavior(this.fadeTime));
    this.addElement(this.image);

    if (this.cfg.soundKey) {
      this.soundElement = new SoundElement(this.cfg.soundKey);
      this.soundElement.addBehavior(new SoundOnPlayBehavior());
      this.addElement(this.soundElement);
    }

    if (this.cfg.duration) {
      this.duration = this.cfg.duration;
    }

    await super.init();
  }

  override onPlay(): void {
    this.image!.x = (this.W - this.image!.getWidth()) / 2;
    this.image!.y = (this.H - this.image!.getHeight()) / 2;

    if (this.cfg.duration) {
      this.duration = this.cfg.duration;
    } else if (this.soundElement?.sound) {
      this.duration = this.soundElement.sound.duration * 1000;
    } else {
      this.duration = 5000;
    }

    super.onPlay();
  }
}
