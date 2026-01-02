import { SceneElement } from "./SceneElement";
import { ImageElement } from "../ImageElement";
import { SoundElement } from "../SoundElement";
import { FallingBehavior } from "../behaviors/FallingBehavior";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior";
import { TiltBehavior } from "../behaviors/TiltBehavior";
import { IntervalTimer } from "../../utils/IntervalTimer";
import type { ImageKey } from "../../core/resources";

interface HeadbladeCfg {
  count?: number;
  duration?: number; // ms
}

export class HeadbladeScene extends SceneElement {
  private totalCount: number;
  private imageList: ImageKey[] = ["hb1", "hb2", "hb3", "hb4", "hb5"];
  private imageSpawner!: IntervalTimer;

  constructor(config: HeadbladeCfg = {}) {
    super();
    this.totalCount = config.count ?? 30;
    this.duration = config.duration ?? 15000;
  }

  override async init(): Promise<void> {
    this.imageSpawner = new IntervalTimer(
      this.duration / this.totalCount,
      () => this.spawnHeadblade(),
      this.totalCount
    );

    const sound = new SoundElement("headblade");
    sound.addChild(new SoundOnPlayBehavior());
    this.addChild(sound);

    await super.init();
  }

  private spawnHeadblade() {
    const key =
      this.imageList[Math.floor(Math.random() * this.imageList.length)];
    const img = new ImageElement(key);
    img.x = Math.random() * this.W;
    img.y = -50;
    const scale = 0.5 * Math.random() + 0.25;
    img.scaleX = scale;
    img.scaleY = scale;
    img.rotation = Math.random() * Math.PI * 2;

    img.addChild(
      new FallingBehavior({
        velocityY: Math.random() * 100 + 100,
        velocityX: Math.random() * 80 - 40,
        gravity: 400 + Math.random() * 200,
        drag: 0.01,
      })
    );

    img.addChild(
      new TiltBehavior({
        rotationSpeed: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2),
        wobbleAmount: 0,
        wobbleSpeed: 0,
      })
    );

    img.init();

    this.addChild(img);
  }

  override update(deltaTime: number): void {
    this.imageSpawner.update(deltaTime);
    super.update(deltaTime);
  }
}
