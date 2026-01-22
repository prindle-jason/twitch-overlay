import { SceneElement } from "./SceneElement";
import { ImageElement } from "../primitives/ImageElement";
import { SoundElement } from "../primitives/SoundElement";
import { GravityBehavior } from "../behaviors/GravityBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { SchedulerElement } from "../composites/SchedulerElement";
import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";

interface HeadbladeCfg {
  count?: number;
  duration?: number; // ms
}

export class HeadbladeScene extends SceneElement {
  readonly type = "headblade" as const;
  private totalCount: number;
  private imageUrls: string[] = [
    localImages.hb1,
    localImages.hb2,
    localImages.hb3,
    localImages.hb4,
    localImages.hb5,
  ];

  constructor(config: HeadbladeCfg = {}) {
    super();
    this.totalCount = config.count ?? 30;
    this.duration = config.duration ?? 15000;
  }

  override async init(): Promise<void> {
    this.addChild(
      new SchedulerElement({
        interval: this.duration / this.totalCount,
        onTick: () => this.spawnHeadblade(),
        count: this.totalCount,
      }),
    );

    const sound = new SoundElement(localSounds.headblade);
    sound.addChild(new SoundOnPlayBehavior());
    this.addChild(sound);

    await super.init();
  }

  private spawnHeadblade() {
    const key =
      this.imageUrls[Math.floor(Math.random() * this.imageUrls.length)];
    //const img = new ImageElement({ imageKey: key });
    const img = new ImageElement({ imageUrl: key });
    img.x = Math.random() * this.W;
    img.y = -50;
    const scale = 0.5 * Math.random() + 0.25;
    img.scaleX = scale;
    img.scaleY = scale;
    img.rotation = Math.random() * Math.PI * 2;

    img.addChild(
      new GravityBehavior({
        velocityY: Math.random() * 100 + 100,
        velocityX: Math.random() * 80 - 40,
        gravity: 400 + Math.random() * 200,
        drag: 0.01,
      }),
    );

    img.addChild(
      new TiltBehavior({
        rotationSpeed: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2),
        wobbleAmount: 0,
        wobbleSpeed: 0,
      }),
    );

    img.init();

    this.addChild(img);
  }
}
