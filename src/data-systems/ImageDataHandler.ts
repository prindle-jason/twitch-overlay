import { ImageLoader } from "../utils/assets/ImageLoader";
import { Sequence } from "../utils/timing/Sequence";
import { DataSequenceElement } from "../data-elements/primitives/DataSequenceElement";

/**
 * Abstract base for image data handling.
 * Encapsulates loading and rendering of static or animated images.
 */
export abstract class ImageDataHandler {
  protected naturalWidth: number = 0;
  protected naturalHeight: number = 0;

  abstract load(imageUrl: string): Promise<void>;
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract cleanup(): void;

  getNaturalWidth(): number {
    return this.naturalWidth;
  }

  getNaturalHeight(): number {
    return this.naturalHeight;
  }
}

/**
 * Static image data: PNG, JPEG, SVG, etc.
 */
export class StaticImageData extends ImageDataHandler {
  private staticImage: HTMLImageElement | null = null;

  override async load(imageUrl: string): Promise<void> {
    const loaded = await ImageLoader.load(imageUrl);
    this.staticImage = loaded.image as HTMLImageElement;

    this.naturalWidth = this.staticImage.naturalWidth;
    this.naturalHeight = this.staticImage.naturalHeight;
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    if (this.staticImage) {
      ctx.drawImage(this.staticImage, 0, 0);
    }
  }

  cleanup(): void {
    this.staticImage = null;
  }
}

/**
 * Animated image data: GIF, WebP animation, APNG, etc.
 * Manages frame sequence and offscreen canvas for rendering.
 */
export class AnimatedImageData extends ImageDataHandler {
  private sequenceElement: DataSequenceElement<ImageData> | null = null;
  private frameCanvas: HTMLCanvasElement | null = null;
  private frameCtx: CanvasRenderingContext2D | null = null;

  override async load(imageUrl: string): Promise<void> {
    const loaded = await ImageLoader.load(imageUrl);
    const sequence = loaded.image as Sequence<ImageData>;

    this.naturalWidth = sequence.getCurrent()!.width;
    this.naturalHeight = sequence.getCurrent()!.height;

    this.sequenceElement = new DataSequenceElement(sequence);
    this.initFrameCanvas();
  }

  private initFrameCanvas(): void {
    this.frameCanvas = document.createElement("canvas");
    const ctx = this.frameCanvas.getContext("2d");
    if (!ctx) {
      throw new Error(
        "[AnimatedImageData] Failed to create frame canvas context",
      );
    }
    this.frameCtx = ctx;
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    const frame = this.sequenceElement?.getCurrent();
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
    this.frameCtx.putImageData(frame, 0, 0);
    ctx.drawImage(this.frameCanvas, 0, 0);
  }

  getSequenceElement(): DataSequenceElement<ImageData> | null {
    return this.sequenceElement;
  }

  cleanup(): void {
    this.sequenceElement = null;
    this.frameCanvas = null;
    this.frameCtx = null;
  }
}

/**
 * Factory to create appropriate ImageData handler based on file extension.
 */
export function createImageData(imageUrl: string): ImageDataHandler {
  const ext = imageUrl.split(".").pop()?.toLowerCase() ?? "";
  const isAnimated = ext === "gif" || ext === "webp" || ext === "apng";

  return isAnimated ? new AnimatedImageData() : new StaticImageData();
}
