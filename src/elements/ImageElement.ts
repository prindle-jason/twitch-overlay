import { TransformElement } from "./TransformElement";
import { logger } from "../utils/logger";
import { ImageLoader } from "../utils/ImageLoader";
import { Sequence } from "../utils/Sequence";
import { SequenceElement } from "./SequenceElement";

interface NewImageElementConfig {
  imageUrl: string;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Unified image element that handles both static and animated images.
 * Detects format from extension, falls back to Content-Type header.
 * Static images use HTMLImageElement, animated use decoded frames.
 * Uses offscreen canvas for rendering so transforms work correctly.
 */
export class ImageElement extends TransformElement {
  private imageUrl: string;
  private isAnimated: boolean = false;

  // Static image
  private staticImage: HTMLImageElement | null = null;

  // Animated image
  private sequenceElement: SequenceElement<ImageData> | null = null;
  private frameCanvas: HTMLCanvasElement | null = null;
  private frameCtx: CanvasRenderingContext2D | null = null;

  constructor(config: NewImageElementConfig) {
    super();
    this.imageUrl = config.imageUrl;

    if (config.scale !== undefined) {
      this.setScale(config.scale);
    }
    if (config.scaleX !== undefined) {
      this.scaleX = config.scaleX;
    }
    if (config.scaleY !== undefined) {
      this.scaleY = config.scaleY;
    }
  }

  override async init(): Promise<void> {
    logger.debug("[NewImageElement] init() loading", { url: this.imageUrl });

    const loaded = await ImageLoader.load(this.imageUrl);

    this.isAnimated = loaded.isAnimated;

    if (this.isAnimated) {
      this.sequenceElement = new SequenceElement(
        loaded.image as Sequence<ImageData>
      );
      this.addChild(this.sequenceElement);
      this.initFrameCanvas();
    } else {
      this.staticImage = loaded.image as HTMLImageElement;
    }

    await super.init();
  }

  //   override update(deltaTime: number): void {
  //     // SequenceElement updates itself as a child
  //     super.update(deltaTime);
  //   }

  override getWidth(): number {
    if (this.isAnimated) {
      const frame = this.sequenceElement?.getCurrent();
      if (!frame) return -1;
      return frame.width * this.scaleX;
    } else {
      if (!this.staticImage) return -1;
      return this.staticImage.naturalWidth * this.scaleX;
    }
  }

  override getHeight(): number {
    if (this.isAnimated) {
      const frame = this.sequenceElement?.getCurrent();
      if (!frame) return -1;
      return frame.height * this.scaleY;
    } else {
      if (!this.staticImage) return -1;
      return this.staticImage.naturalHeight * this.scaleY;
    }
  }

  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    if (this.isAnimated) {
      this.drawAnimatedFrame(ctx);
    } else if (this.staticImage) {
      ctx.drawImage(this.staticImage, 0, 0);
    }
  }

  private drawAnimatedFrame(ctx: CanvasRenderingContext2D): void {
    const frame = this.sequenceElement!.getCurrent();
    if (!frame || !this.frameCanvas || !this.frameCtx) return;

    // Update offscreen canvas size if needed
    if (
      this.frameCanvas.width !== frame.width ||
      this.frameCanvas.height !== frame.height
    ) {
      this.frameCanvas.width = frame.width;
      this.frameCanvas.height = frame.height;
    }

    // Paint ImageData to offscreen canvas, then draw to main canvas
    // This allows transforms (rotation, scale) to apply correctly
    this.frameCtx.putImageData(frame, 0, 0);
    ctx.drawImage(this.frameCanvas, 0, 0);
  }

  private initFrameCanvas(): void {
    this.frameCanvas = document.createElement("canvas");
    const ctx = this.frameCanvas.getContext("2d");
    if (!ctx) {
      throw new Error(
        "[NewImageElement] Failed to create frame canvas context"
      );
    }
    this.frameCtx = ctx;
  }
}
