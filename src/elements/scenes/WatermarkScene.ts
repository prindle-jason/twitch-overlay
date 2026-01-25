import { SceneElement } from "./SceneElement";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { localImages } from "../../utils/assets/images";
import { pickRandom } from "../../utils/random";
import { ImageElement } from "../primitives/ImageElement";

const WATERMARK_URLS: string[] = [
  localImages.activateWindows,
  localImages.gettyImages,
  localImages.hypercam,
  localImages.notLive,
  localImages.seelWatermark,
  localImages.stockImage,
  localImages.toBeContinued,
  localImages.viewerDiscretion,
];

interface WatermarkCfg {
  duration?: number;
  fadeTime?: number;
  imageUrl?: string;
}

export class WatermarkScene extends SceneElement {
  readonly type = "watermark" as const;
  private fadeTime: number;
  private watermarkUrl: string;
  private image!: ImageElement;
  static eventIds = ["watermark"];

  constructor(cfg: WatermarkCfg = {}) {
    super();
    this.duration = cfg.duration ?? 300000;
    this.fadeTime = cfg.fadeTime ?? 0.05;
    this.watermarkUrl = cfg.imageUrl ?? pickRandom(WATERMARK_URLS);
  }

  override async init(): Promise<void> {
    this.image = new ImageElement({
      imageUrl: this.watermarkUrl,
      width: this.W,
      height: this.H,
    });
    this.image.addChild(new FadeInOutBehavior({ fadeTime: this.fadeTime }));
    this.addChild(this.image);
    await super.init();
  }

  override play(): void {
    // Scale to cover the full canvas area
    /*this.image.scaleX = this.W / this.image.getWidth();
    this.image.scaleY = this.H / this.image.getHeight();
    this.image.x = 0;
    this.image.y = 0;*/

    super.play();
  }

  override finish(): void {
    super.finish();
    // Clear element reference to prevent memory leaks
    this.image = null as any;
  }
}
