import { Effect } from "./Effect";
import { ImageElement } from "../elements/ImageElement";
import { SoundElement } from "../elements/SoundElement";
import { ImageScaleBehavior } from "../behaviors/ImageScaleBehavior";
import { SlideBehavior } from "../behaviors/SlideBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import type { ImageKey, SoundKey } from "../core/resources";

interface SideCfg {
  imageKey: ImageKey;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

interface ConvergingCfg {
  duration?: number;
  left: SideCfg;
  right: SideCfg;
  soundKey?: SoundKey;
  scale?: number;
  fadeTime?: number;
}

export class ConvergingSlideEffect extends Effect {
  private cfg: ConvergingCfg;
  private leftImage: ImageElement | null = null;
  private rightImage: ImageElement | null = null;

  constructor(cfg: ConvergingCfg) {
    const { duration = 4000 } = cfg;
    super({ duration });
    this.cfg = cfg;

    const scale = cfg.scale ?? 0.25;
    const fadeTime = cfg.fadeTime ?? 0.2;

    // Create elements without sizing (images not loaded yet)
    this.leftImage = new ImageElement(cfg.left.imageKey);
    this.leftImage.addBehavior(
      new ImageScaleBehavior({ scaleX: scale, scaleY: scale })
    );
    this.addElement(this.leftImage);

    this.rightImage = new ImageElement(cfg.right.imageKey);
    this.rightImage.addBehavior(
      new ImageScaleBehavior({ scaleX: scale, scaleY: scale })
    );
    this.addElement(this.rightImage);

    if (cfg.soundKey) {
      const sound = new SoundElement(cfg.soundKey);
      sound.addBehavior(new SoundOnPlayBehavior());
      this.addElement(sound);
    }
  }

  override onPlay(): void {
    super.onPlay();
    console.log("ConvergingSlideEffect onPlay");
    this.setSlideBehaviors();
  }

  private setSlideBehaviors(): void {
    const { W, H } = this;
    const scale = this.cfg.scale ?? 0.25;
    const fadeTime = this.cfg.fadeTime ?? 0.2;

    if (this.leftImage && this.leftImage.image) {
      const leftW = this.leftImage.image.naturalWidth * scale;
      const leftH = this.leftImage.image.naturalHeight * scale;
      const leftStartX = this.cfg.left.startX ?? 0 - leftW;
      const leftStartY = this.cfg.left.startY ?? H;
      const leftEndX = this.cfg.left.endX ?? 0;
      const leftEndY = this.cfg.left.endY ?? H - leftH;
      this.leftImage.addBehavior(
        new SlideBehavior({
          startX: leftStartX,
          startY: leftStartY,
          endX: leftEndX,
          endY: leftEndY,
          fadeTime,
        })
      );
    }

    if (this.rightImage && this.rightImage.image) {
      const rightW = this.rightImage.image.naturalWidth * scale;
      const rightH = this.rightImage.image.naturalHeight * scale;
      const rightStartX = this.cfg.right.startX ?? W;
      const rightStartY = this.cfg.right.startY ?? H;
      const rightEndX = this.cfg.right.endX ?? W - rightW;
      const rightEndY = this.cfg.right.endY ?? H - rightH;
      this.rightImage.addBehavior(
        new SlideBehavior({
          startX: rightStartX,
          startY: rightStartY,
          endX: rightEndX,
          endY: rightEndY,
          fadeTime,
        })
      );
    }
  }
}
