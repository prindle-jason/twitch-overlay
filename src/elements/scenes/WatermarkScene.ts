import { SceneElement } from "./SceneElement";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { resolveElementPosition } from "../../utils/positioning";
import {
  resolveWatermarkConfig,
  type WatermarkScenePayload,
} from "./watermarkOptions";

export class WatermarkScene extends SceneElement {
  readonly type = "watermark" as const;
  private readonly config;
  private image!: ImageElement;
  static eventIds = ["watermark"];

  constructor(payload?: WatermarkScenePayload) {
    super();
    this.config = resolveWatermarkConfig(payload);
    this.duration = this.config.duration;
  }

  override async init(): Promise<void> {
    this.image = new ImageElement({
      imageUrl: this.config.imageUrl,
    });
    this.image.addChild(
      new FadeInOutBehavior({ fadeTime: this.config.fadeTime }),
    );

    if (this.config.soundUrl) {
      const sound = new SoundElement(this.config.soundUrl);
      sound.addChild(new SoundOnPlayBehavior());
      this.addChild(sound);
    }

    this.addChild(this.image);
    await super.init();

    const imageWidth = this.image.getWidth() ?? 0;
    const imageHeight = this.image.getHeight() ?? 0;
    const position = resolveElementPosition(
      this.config.position,
      imageWidth,
      imageHeight,
      this.W,
      this.H,
    );
    this.image.x = position.x;
    this.image.y = position.y;
  }

  override finish(): void {
    super.finish();
    // Clear element reference to prevent memory leaks
    this.image = null as any;
  }
}
