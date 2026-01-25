import { TransformElement, TransformElementConfig } from "./TransformElement";
import { logger } from "../../utils/logger";
import { ImageLoader } from "../../utils/assets/ImageLoader";
import {
  calculateImageScale,
  type ImageScaleStrategy,
} from "../../utils/dimensions";
import { Sequence } from "../../utils/timing/Sequence";
import { SequenceElement } from "../composites/SequenceElement";

type ImageElementConfig =
  | ({
      imageUrl: string;
      scaleStrategy: "stretch";
      width: number;
      height: number;
    } & TransformElementConfig)
  | ({
      imageUrl: string;
      scaleStrategy?: "fit" | "fill" | "none";
    } & TransformElementConfig);

/**
 * Unified image element that handles both static and animated images.
 * Detects format from extension, falls back to Content-Type header.
 * Static images use HTMLImageElement, animated use decoded frames.
 * Uses offscreen canvas for rendering so transforms work correctly.
 *
 * Scale behavior:
 * - If scale is explicitly provided (scale/scaleX/scaleY), it takes precedence
 * - If width/height provided, apply scaleStrategy to calculate scale
 * - If nothing provided, use natural dimensions
 *
 * Scale strategies:
 * - 'fit': Scale to fit inside bounds, maintain aspect ratio (default)
 * - 'fill': Scale to fill bounds completely, maintain aspect ratio
 * - 'stretch': Scale to exact dimensions, ignore aspect ratio (requires both width and height)
 * - 'none': No auto-scaling, use natural dimensions
 */
export class ImageElement extends TransformElement {
  private imageUrl!: string;
  private scaleStrategy: ImageScaleStrategy;
  private hasExplicitScale = false;
  private isAnimated: boolean = false;
  private naturalWidth!: number;
  private naturalHeight!: number;

  // Static image
  private staticImage: HTMLImageElement | null = null;

  // Animated image
  private sequenceElement: SequenceElement<ImageData> | null = null;
  private frameCanvas: HTMLCanvasElement | null = null;
  private frameCtx: CanvasRenderingContext2D | null = null;

  constructor(config: ImageElementConfig) {
    super(config);
    this.imageUrl = config.imageUrl;
    this.scaleStrategy = config.scaleStrategy ?? "none";

    // Check for explicit scale after super
    const s = config.scale;
    this.hasExplicitScale =
      typeof s === "number" ||
      (typeof s === "object" &&
        s !== null &&
        (s.x !== undefined || s.y !== undefined));
  }

  override async init(): Promise<void> {
    logger.debug("[ImageElement] init() loading", { url: this.imageUrl });

    const loaded = await ImageLoader.load(this.imageUrl);

    this.isAnimated = loaded.isAnimated;

    if (this.isAnimated) {
      const sequence = loaded.image as Sequence<ImageData>;
      this.naturalWidth = sequence.getCurrent()!.width;
      this.naturalHeight = sequence.getCurrent()!.height;

      this.sequenceElement = new SequenceElement(sequence);
      this.addChild(this.sequenceElement);
      this.initFrameCanvas();
    } else {
      this.staticImage = loaded.image as HTMLImageElement;
      this.naturalWidth = this.staticImage.naturalWidth;
      this.naturalHeight = this.staticImage.naturalHeight;
    }

    this.validateScaleStrategy();

    this.applyAutoScale();

    this.setWidth(this.naturalWidth * this.scaleX);
    this.setHeight(this.naturalHeight * this.scaleY);
    await super.init();
  }

  /**
   * Validates scale strategy and falls back if requirements aren't met.
   */
  private validateScaleStrategy(): void {
    const hasWidth = super.getWidth() !== null;
    const hasHeight = super.getHeight() !== null;

    if (this.scaleStrategy === "stretch" && (!hasWidth || !hasHeight)) {
      logger.warn(
        "[ImageElement] stretch strategy requires both width and height; falling back to none",
        { url: this.imageUrl },
      );
      this.scaleStrategy = "none";
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
        "[NewImageElement] Failed to create frame canvas context",
      );
    }
    this.frameCtx = ctx;
  }

  private applyAutoScale(): void {
    if (this.hasExplicitScale) {
      return;
    }

    if (this.getWidth() === null && this.getHeight() === null) {
      logger.debug(
        "[ImageElement] No dimensions provided, using natural size",
        {
          url: this.imageUrl,
        },
      );
      this.setScale(1);
      return;
    }

    // If no dimensions configured, use natural dimensions (scale = 1)
    //const configWidth = this.getWidth();
    //const configHeight = this.getHeight();

    logger.debug("[ImageElement] applyAutoScale check", {
      url: this.imageUrl,
      hasExplicitScale: this.hasExplicitScale,
      configWidth: this.getWidth(),
      configHeight: this.getHeight(),
      naturalWidth: this.naturalWidth,
      naturalHeight: this.naturalHeight,
      strategy: this.scaleStrategy,
    });

    const scale = calculateImageScale({
      configWidth: this.getWidth(),
      configHeight: this.getHeight(),
      naturalWidth: this.naturalWidth!,
      naturalHeight: this.naturalHeight!,
      strategy: this.scaleStrategy,
    });

    this.setScale(scale);
  }

  override finish(): void {
    super.finish();
    // Clean up image resources to prevent memory leaks
    this.staticImage = null;
    this.sequenceElement = null;
    this.frameCanvas = null;
    this.frameCtx = null;
  }
}
