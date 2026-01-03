import { SceneElement } from "./SceneElement";
import { ImageElement } from "../ImageElement";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import type { ImageKey } from "../../core/resources";
import { pickRandom } from "../../utils/random";

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

export class WatermarkScene extends SceneElement {
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
    this.image = new ImageElement({ imageKey: this.watermarkKey });
    this.image.addChild(new FadeInOutBehavior({ fadeTime: this.fadeTime }));
    this.addChild(this.image);
    await super.init();
  }

  override play(): void {
    // Scale to cover the full canvas area
    this.image.scaleX = this.W / this.image.getWidth();
    this.image.scaleY = this.H / this.image.getHeight();
    this.image.x = 0;
    this.image.y = 0;

    super.play();
  }
}
