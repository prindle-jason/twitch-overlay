import { Effect } from "./Effect";
import { ImageElement } from "../elements/ImageElement";
import { ImageFadeInOutBehavior } from "../behaviors/ImageFadeInOutBehavior";
import type { ImageKey } from "../core/resources";
import { pickRandom } from "../utils/random";

const WATERMARK_KEYS: ImageKey[] = [
  "activateWindows",
  "gettyImages",
  "hypercam",
  "notLive",
  "seelWatermark",
  "stockImage",
  "toBeContinued",
  "viewerDiscretion",
];

interface WatermarkCfg {
  duration?: number;
  fadeTime?: number;
  imageKey?: ImageKey;
}

export class WatermarkEffect extends Effect {
  private fadeTime: number;
  private watermarkKey: ImageKey;
  private image!: ImageElement;

  constructor(cfg: WatermarkCfg = {}) {
    super();
    this.duration = cfg.duration ?? 300000;
    this.fadeTime = cfg.fadeTime ?? 0.05;
    this.watermarkKey = cfg.imageKey ?? pickRandom(WATERMARK_KEYS);
  }

  override async init(): Promise<void> {
    this.image = new ImageElement(this.watermarkKey);
    this.image.addBehavior(new ImageFadeInOutBehavior(this.fadeTime));
    this.addElement(this.image);
    await super.init();
  }

  override onPlay(): void {
    // Scale to cover the full canvas area
    this.image.scaleX = this.W / this.image.getWidth();
    this.image.scaleY = this.H / this.image.getHeight();
    this.image.x = 0;
    this.image.y = 0;

    super.onPlay();
  }
}
