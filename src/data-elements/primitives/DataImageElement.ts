import { DataElement, DataElementConfig } from "../primitives/DataElement";
import { ImageElement } from "../../elements/primitives/ImageElement";
import { logger } from "../../utils/logger";

interface DataImageElementConfig extends DataElementConfig {
  imageUrl?: string;
  scaleStrategy?: "fit" | "fill" | "stretch" | "none";
  scale?: number | { x?: number; y?: number };
  width?: number;
  height?: number;
}

/**
 * Data-driven image element that wraps ImageElement.
 * Handles image loading, scaling, and animation detection.
 * Delegates transform properties (x, y) to the child ImageElement.
 */
export class DataImageElement extends DataElement {
  private imageElement: ImageElement | null = null;

  constructor(config: Partial<DataImageElementConfig> = {}) {
    super({ id: config.id, duration: config.duration });
    logger.warn("[DataImage] Created", { imageUrl: config.imageUrl });

    // Create the wrapped ImageElement
    const imageConfig: any = {
      imageUrl: config.imageUrl ?? "",
      scaleStrategy: config.scaleStrategy ?? "none",
    };

    // Add optional properties
    if (config.scale !== undefined) imageConfig.scale = config.scale;
    if (config.width !== undefined) imageConfig.width = config.width;
    if (config.height !== undefined) imageConfig.height = config.height;

    this.imageElement = new ImageElement(imageConfig);
    //this.addChild(this.imageElement as any);
  }

  override async init(): Promise<void> {
    logger.warn("[DataImage] init() called");
    await this.imageElement?.init();
    await super.init();
  }

  override play(): void {
    logger.warn("[DataImage] play() called");
    this.imageElement?.play();
    super.play();
  }

  override drawSelf(ctx: CanvasRenderingContext2D): void {
    this.imageElement?.drawSelf(ctx);
  }

  override finish(): void {
    this.imageElement?.finish();
    super.finish();
  }

  // ---------------------------------------------------------------------------------
  // Transform delegation (delegate to ImageElement)
  // ---------------------------------------------------------------------------------
  get x(): number {
    return this.imageElement?.x ?? 0;
  }

  set x(value: number) {
    if (this.imageElement) {
      this.imageElement.x = value;
    }
  }

  get y(): number {
    return this.imageElement?.y ?? 0;
  }

  set y(value: number) {
    if (this.imageElement) {
      this.imageElement.y = value;
    }
  }

  getWidth(): number | null {
    return this.imageElement?.getWidth() ?? null;
  }

  getHeight(): number | null {
    return this.imageElement?.getHeight() ?? null;
  }
}
