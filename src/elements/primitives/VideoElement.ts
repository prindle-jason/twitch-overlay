import { TransformElement, TransformElementConfig } from "./TransformElement";

export interface VideoElementConfig extends TransformElementConfig {
  videoUrl: string;
  loopCount?: number;
  muted?: boolean;
}

export interface VideoSourceCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export class VideoElement extends TransformElement {
  private video: HTMLVideoElement;
  private videoUrl: string;
  private remainingLoops: number;
  private muted: boolean;
  private sourceCrop: VideoSourceCrop | null = null;
  // Only true if the video was actively playing when paused
  private paused = false;

  constructor(config: VideoElementConfig) {
    super(config);
    this.videoUrl = config.videoUrl;
    this.remainingLoops = config.loopCount ?? 1;
    this.muted = config.muted ?? false;

    // Create off-screen video element
    this.video = document.createElement("video");
    this.video.src = this.videoUrl;
    this.video.preload = "auto";
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

    // Manage finite looping manually for reliability across browsers
    this.video.loop = false;
    this.video.addEventListener(
      "ended",
      () => {
        if (this.remainingLoops <= 1) {
          this.finish();
          return;
        }
        this.remainingLoops--;
        // Restart playback
        this.video.currentTime = 0;
        // If element is still playing, continue; otherwise respect paused/finished state
        if (this.getState() === "PLAYING") {
          this.video.play().catch(() => {});
        }
      },
      { once: false },
    );

    await super.init();
  }

  play() {
    super.play();

    this.duration = this.video.duration * this.remainingLoops * 1000;
    this.video.play();
    this.paused = false;
  }

  getNaturalSize(): { w: number; h: number } {
    return {
      w: this.video.videoWidth,
      h: this.video.videoHeight,
    };
  }

  setSourceCrop(crop: VideoSourceCrop | null): void {
    this.sourceCrop = crop;
  }

  // getVideo(): HTMLVideoElement {
  //   return this.video;
  // }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    const width = this.getWidth() ?? this.video.videoWidth;
    const height = this.getHeight() ?? this.video.videoHeight;

    if (this.sourceCrop) {
      const { sx, sy, sw, sh } = this.sourceCrop;
      ctx.drawImage(this.video, sx, sy, sw, sh, 0, 0, width, height);
      return;
    }

    ctx.drawImage(this.video, 0, 0, width, height);
  }

  /** Pause the underlying video if currently playing. */
  pauseVideo(): void {
    if (this.video && !this.video.paused) {
      this.paused = true;
      this.video.pause();
    }
  }

  /** Stop playback and reset to start. */
  stopVideo(): void {
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
      this.paused = false;
    }
  }

  override pause(): void {
    if (this.getState() !== "PLAYING") {
      return;
    }
    this.pauseVideo();
    super.pause();
  }

  override resume(): void {
    if (this.getState() !== "PAUSED") {
      return;
    }
    if (this.paused && this.video) {
      this.video.play().catch(() => {});
      this.paused = false;
    }
    super.resume();
  }

  override finish(): void {
    this.stopVideo();
    this.video = null as any;
    super.finish();
  }
}
