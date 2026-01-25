import { TransformElement, TransformElementConfig } from "./TransformElement";

export interface VideoElementConfig extends TransformElementConfig {
  videoUrl: string;
  loop?: boolean;
  muted?: boolean;
}

export class VideoElement extends TransformElement {
  private video: HTMLVideoElement;
  private videoUrl: string;
  private loop: boolean;
  private muted: boolean;

  constructor(config: VideoElementConfig) {
    super(config);
    this.videoUrl = config.videoUrl;
    this.loop = config.loop ?? false;
    this.muted = config.muted ?? false;

    // Create off-screen video element
    this.video = document.createElement("video");
    this.video.src = this.videoUrl;
    this.video.preload = "auto";
    this.video.loop = this.loop;
    this.video.muted = this.muted;
  }

  async init() {
    // Wait for video metadata to load
    await new Promise<void>((resolve, reject) => {
      this.video.addEventListener("loadedmetadata", () => resolve(), {
        once: true,
      });
      this.video.addEventListener("error", () => reject(), { once: true });
    });

    // Set duration based on video length (convert seconds to ms)
    if (!this.loop) {
      this.duration = this.video.duration * 1000;
    }

    // Auto-finish when video ends (if not looping)
    if (!this.loop) {
      this.video.addEventListener("ended", () => this.finish());
    }

    await super.init();
  }

  play() {
    super.play();
    this.video.play();
  }

  getVideo(): HTMLVideoElement {
    return this.video;
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    const width = this.getWidth() ?? this.video.videoWidth;
    const height = this.getHeight() ?? this.video.videoHeight;

    ctx.drawImage(this.video, 0, 0, width, height);
  }

  override finish(): void {
    this.video.pause();
    this.video = null as any;
    super.finish();
  }
}
