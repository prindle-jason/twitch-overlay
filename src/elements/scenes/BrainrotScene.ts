import { SceneElement } from "./SceneElement";
import { VideoElement } from "../primitives/VideoElement";
import { pickRandomByWeight } from "../../utils/random";
import { localVideos } from "../../utils/assets/videos";
import { positionCorner } from "../../utils/positioning";

interface VideoOption {
  weight: number;
  videoUrl: string;
  width?: number;
  height?: number;
  scale: number;
  muted?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
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
  },
  {
    weight: 1,
    videoUrl: localVideos.oiia,
    width: 1080,
    height: 1918,
    muted: false,
    position: "bottom-left",
    scale: 0.25,
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
      loop: false,
    });

    this.addChild(this.videoElement);
    await super.init();
  }

  override finish(): void {
    super.finish();
    // Clear element reference to prevent memory leaks
    this.videoElement = null as any;
  }
}
