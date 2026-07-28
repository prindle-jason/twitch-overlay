import {
  DataTransformElement,
  DataTransformElementConfig,
} from "./DataTransformElement";
import {
  ImageDataHandler,
  StaticImageData,
  AnimatedImageData,
  createImageData,
} from "../../data-systems/ImageDataHandler";
import {
  calculateImageScale,
  ImageScaleInput,
  ImageScaleStrategy,
  ScaleConfig,
} from "../../utils/dimensions";

export interface DataImageElementConfig extends DataTransformElementConfig {
  imageUrl: string;
  width: number;
  height: number;
  scaleStrategy?: "fit" | "fill" | "stretch";
}

/**
 * Data-driven image element.
 * Dimensions (width, height) are known immediately from config.
 * Images load asynchronously in init(); loading doesn't block dimensions.
 * Supports scale strategies: fit (default), fill, stretch.
 * Delegates image loading and rendering to ImageDataHandler.
 * Inherits transform (x, y, scale, rotation, opacity) from DataTransformElement.
 */
export class DataImageElement extends DataTransformElement {
  protected imageUrl: string;
  protected scaleStrategy: ImageScaleStrategy;
  protected imageData: ImageDataHandler | null = null;

  constructor(config: DataImageElementConfig) {
    super(config as DataTransformElementConfig);

    this.imageUrl = config.imageUrl;
    this.width = config.width;
    this.height = config.height;
    this.scaleStrategy = config.scaleStrategy ?? "fit";
  }

  override async init(): Promise<void> {
    // Create appropriate ImageDataHandler instance and load
    this.imageData = createImageData(this.imageUrl);
    await this.imageData.load(this.imageUrl);

    // If this is an animated image, add its SequenceElement as a child
    // This allows both static and animated images to work with DataImageElement
    if (this.imageData instanceof AnimatedImageData) {
      const seqElem = this.imageData.getSequenceElement();
      if (seqElem) {
        this.addChild(seqElem);
      }
    }

    this.calculateScale();

    await super.init();
  }

  /**
   * Calculate scale factors based on natural image size and display box.
   */
  protected calculateScale(): void {
    if (!this.imageData) return;

    const scaleInput: ImageScaleInput = {
      configWidth: this.width,
      configHeight: this.height,
      naturalWidth: this.imageData.getNaturalWidth(),
      naturalHeight: this.imageData.getNaturalHeight(),
      strategy: this.scaleStrategy,
    };

    const scale: ScaleConfig = calculateImageScale(scaleInput);
    this.setScale(scale);
  }

  override drawSelf(ctx: CanvasRenderingContext2D): void {
    if (!this.imageData) return;
    this.imageData.draw(ctx);
  }

  override finish(): void {
    if (this.imageData != null) {
      this.imageData.cleanup();
    }

    this.imageData = null;
    super.finish();
  }
}

/**
 * Static image element: PNG, JPEG, SVG.
 */
export class DataStaticImageElement extends DataImageElement {
  constructor(config: DataImageElementConfig) {
    super(config);
  }
}

/**
 * Animated image element: GIF, WebP, APNG.
 * Manages frame sequence as a child for proper lifecycle update.
 */
export class DataAnimatedImageElement extends DataImageElement {
  constructor(config: DataImageElementConfig) {
    super(config);
  }

  override async init(): Promise<void> {
    this.imageData = createImageData(this.imageUrl);
    await this.imageData.load(this.imageUrl);

    this.calculateScale();

    const seqElem = (this.imageData as AnimatedImageData).getSequenceElement();
    if (seqElem) {
      this.addChild(seqElem);
    }

    await super.init();
  }
}
