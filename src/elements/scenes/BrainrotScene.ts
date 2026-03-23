import { SceneElement } from "./SceneElement";
import { VideoElement } from "../primitives/VideoElement";
import { pickRandomByWeight } from "../../utils/random";
import { localVideos } from "../../utils/assets/videos";
import { positionCorner } from "../../utils/positioning";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";

interface VideoOption {
  weight: number;
  videoUrl: string;
  width?: number;
  height?: number;
  scale: number;
  muted?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  loopCount: number;
}

const VIDEO_OPTIONS: readonly VideoOption[] = [
  {
    weight: 1,
    videoUrl: localVideos.surfers,
    width: 1080,
    height: 1918,
    muted: false,
    position: "bottom-right",
    scale: 0.25,
    loopCount: 1,
  },
  {
    weight: 1,
    videoUrl: localVideos.oiia,
    width: 1080,
    height: 1918,
    muted: false,
    position: "bottom-left",
    scale: 0.25,
    loopCount: 3,
  },
];

export class BrainrotScene extends SceneElement {
  readonly type = "brainrot" as const;
  private videoElement!: VideoElement;

  constructor() {
    super();
    this.duration = 60000; // End longer video after 60 seconds
  }

  override async init(): Promise<void> {
    // Pick a random video option based on weight
    const option = pickRandomByWeight(
      VIDEO_OPTIONS.map((opt) => ({
        weight: opt.weight,
        item: opt,
      })),
    );

    // Calculate scaled dimensions for bottom-right placement
    //const scale = 0.4;
    const scaledWidth = (option.width ?? 640) * option.scale;
    const scaledHeight = (option.height ?? 360) * option.scale;
    const padding = 20;

    const pos = positionCorner(
      option.position ?? "bottom-right",
      scaledWidth,
      scaledHeight,
      this.W,
      this.H,
      padding,
    );

    this.videoElement = new VideoElement({
      videoUrl: option.videoUrl,
      x: pos.x,
      y: pos.y,
      width: option.width,
      height: option.height,
      scale: option.scale,
      muted: option.muted,
      loopCount: option.loopCount,
    });

    this.addChild(this.videoElement);
    await super.init();
  }

  override play(): void {
    super.play();
    const videoDuration = this.videoElement.getDuration();
    this.videoElement.addChild(
      new FadeInOutBehavior({
        fadeMode: "absolute",
        fadeMs: 5000,
        duration: Math.min(videoDuration, this.duration),
      }),
    );
  }

  protected override updateSelf(deltaTime: number): void {
    // Finish the scene when the video completes all loops
    if (this.videoElement.getState() === "FINISHED") {
      this.finish();
    }
  }

  override finish(): void {
    super.finish();
    // Clear element reference to prevent memory leaks
    this.videoElement = null as any;
  }
}
