import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import { VideoElement } from "../primitives/VideoElement";
import {
  calculateImageScale,
  type ImageScaleStrategy,
} from "../../utils/dimensions";
import { resolveElementPosition } from "../../utils/positioning";
import { SceneElement } from "./SceneElement";
import { resolveVideoConfig, type VideoScenePayload } from "./videoOptions";

export class VideoScene extends SceneElement {
  readonly type = "video" as const;
  private readonly config;
  private videoElement!: VideoElement;

  constructor(payload: VideoScenePayload) {
    super();
    this.config = resolveVideoConfig(payload);
  }

  override async init(): Promise<void> {
    this.videoElement = new VideoElement({
      videoUrl: this.config.videoUrl,
      muted: this.config.muted,
      loopCount: this.config.loopCount,
    });

    this.addChild(this.videoElement);
    await super.init();

    const { w: natW, h: natH } = this.videoElement.getNaturalSize();
    const targetW = this.config.width;
    const targetH = this.config.height;

    if (
      this.config.sizeMode === "cover" &&
      targetW != null &&
      targetH != null
    ) {
      const crop = this.calculateCoverCrop(natW, natH, targetW, targetH);
      const pos = this.resolvePosition(targetW, targetH);
      this.videoElement.setSourceCrop(crop);
      this.videoElement.x = pos.x;
      this.videoElement.y = pos.y;
      this.videoElement.setWidth(targetW);
      this.videoElement.setHeight(targetH);
      return;
    }

    const strategy = this.mapSizeModeToImageScaleStrategy(this.config.sizeMode);
    const scale = calculateImageScale({
      configWidth: this.config.width ?? null,
      configHeight: this.config.height ?? null,
      naturalWidth: natW,
      naturalHeight: natH,
      strategy,
    });

    const scaleX = typeof scale === "number" ? scale : (scale.x ?? 1);
    const scaleY = typeof scale === "number" ? scale : (scale.y ?? 1);
    const renderW = natW * scaleX;
    const renderH = natH * scaleY;

    const pos = this.resolvePosition(renderW, renderH);
    this.videoElement.setSourceCrop(null);
    this.videoElement.x = pos.x;
    this.videoElement.y = pos.y;
    this.videoElement.setWidth(renderW);
    this.videoElement.setHeight(renderH);
  }

  override play(): void {
    super.play();

    if (this.config.fadeDurationMs && this.config.fadeDurationMs > 0) {
      this.videoElement.addChild(
        new FadeInOutBehavior({
          fadeMode: "absolute",
          fadeMs: this.config.fadeDurationMs,
          duration: this.videoElement.getDuration(),
        }),
      );
    }
  }

  protected override updateSelf(): void {
    if (this.videoElement.getState() === "FINISHED") {
      this.finish();
    }
  }

  override finish(): void {
    super.finish();
    this.videoElement = null as any;
  }

  private mapSizeModeToImageScaleStrategy(
    sizeMode: string,
  ): ImageScaleStrategy {
    switch (sizeMode) {
      case "native":
        return "none";
      case "contain":
        return "fit";
      case "cover":
        return "fill";
      case "stretch":
        return "stretch";
      default:
        return "none";
    }
  }

  private resolvePosition(
    renderW: number,
    renderH: number,
  ): { x: number; y: number } {
    return resolveElementPosition(
      this.config.position,
      renderW,
      renderH,
      this.W,
      this.H,
    );
  }

  private calculateCoverCrop(
    naturalW: number,
    naturalH: number,
    targetW: number,
    targetH: number,
  ): { sx: number; sy: number; sw: number; sh: number } {
    const sourceAspect = naturalW / naturalH;
    const targetAspect = targetW / targetH;

    if (sourceAspect > targetAspect) {
      // Source is wider than target: crop left/right.
      const sh = naturalH;
      const sw = sh * targetAspect;
      const sx = (naturalW - sw) / 2;
      return { sx, sy: 0, sw, sh };
    }

    // Source is taller than target: crop top/bottom.
    const sw = naturalW;
    const sh = sw / targetAspect;
    const sy = (naturalH - sh) / 2;
    return { sx: 0, sy, sw, sh };
  }
}
