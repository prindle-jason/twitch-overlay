import { RenderableEntity } from './RenderableEntity';
import { AssetManager } from '../managers/AssetManager';
import { type EntityConfig } from './Entity';

/**
 * ImageEntity - Displays an image loaded from AssetManager
 * 
 * Handles image loading, caching, and rendering.
 * Automatically sets dimensions when image loads.
 */
export class ImageEntity extends RenderableEntity {
  private image: HTMLImageElement | null = null;
  private imageFilename: string;
  private assetManager: AssetManager;
  private isImageLoaded: boolean = false;

  constructor(imageFilename: string, name: string = 'image', config?: EntityConfig) {
    super(name, config);
    this.imageFilename = imageFilename;
    this.assetManager = AssetManager.getInstance();
  }

  // === Lifecycle ===

  async onInitialize(): Promise<void> {
    try {
      console.log(`🖼️ Loading image: ${this.imageFilename}`);
      this.image = await this.assetManager.getImage(this.imageFilename);
      
      // Set entity dimensions based on image
      this.setDimensions(this.image.width, this.image.height);
      this.isImageLoaded = true;
      
      console.log(`✅ Image loaded for ${this.name}: ${this.width}x${this.height}`);
    } catch (error) {
      console.error(`❌ Failed to load image for ${this.name}:`, error);
      // Entity continues to exist but won't render anything
      this.isImageLoaded = false;
    }
  }

  // === Rendering ===

  protected renderSelf(ctx: CanvasRenderingContext2D): void {
    if (!this.image || !this.isImageLoaded) {
      // Optionally render a placeholder or debug rect
      this.renderPlaceholder(ctx);
      return;
    }

    const offset = this.getRenderOffset();
    ctx.drawImage(this.image, offset.x, offset.y, this.width, this.height);
  }

  private renderPlaceholder(ctx: CanvasRenderingContext2D): void {
    // Simple debug rectangle when image isn't loaded
    const offset = this.getRenderOffset();
    const width = this.width || 100; // Default size if no dimensions
    const height = this.height || 100;

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(offset.x, offset.y, width, height);
    
    // X mark to indicate missing image
    ctx.beginPath();
    ctx.moveTo(offset.x, offset.y);
    ctx.lineTo(offset.x + width, offset.y + height);
    ctx.moveTo(offset.x + width, offset.y);
    ctx.lineTo(offset.x, offset.y + height);
    ctx.stroke();
  }

  // === Image Management ===

  /**
   * Get the loaded image (null if not loaded)
   */
  getImage(): HTMLImageElement | null {
    return this.image;
  }

  /**
   * Get the image filename
   */
  getImageFilename(): string {
    return this.imageFilename;
  }

  /**
   * Check if image is successfully loaded
   */
  isLoaded(): boolean {
    return this.isImageLoaded;
  }

  /**
   * Change the image (triggers reload)
   */
  async setImage(imageFilename: string): Promise<void> {
    this.imageFilename = imageFilename;
    this.image = null;
    this.isImageLoaded = false;
    
    // Reload with new image
    await this.onInitialize();
  }

  // === Utility Methods ===

  /**
   * Get aspect ratio of the image (width/height)
   */
  getAspectRatio(): number {
    if (!this.width || !this.height) return 1;
    return this.width / this.height;
  }

  /**
   * Scale to fit within given dimensions while maintaining aspect ratio
   */
  scaleToFit(maxWidth: number, maxHeight: number): void {
    if (!this.width || !this.height) return;

    const aspectRatio = this.getAspectRatio();
    const targetAspectRatio = maxWidth / maxHeight;

    if (aspectRatio > targetAspectRatio) {
      // Image is wider - scale based on width
      const scale = maxWidth / this.width;
      this.setScale(scale);
    } else {
      // Image is taller - scale based on height
      const scale = maxHeight / this.height;
      this.setScale(scale);
    }
  }

  /**
   * Scale to exact size (may distort aspect ratio)
   * Uses independent X and Y scaling to achieve exact dimensions
   */
  scaleToSize(targetWidth: number, targetHeight: number): void {
    if (!this.width || !this.height) return;

    this.scaleX = targetWidth / this.width;
    this.scaleY = targetHeight / this.height;
  }

  // === Cloning Support ===

  clone(): ImageEntity {
    // Create new instance with same parameters
    const cloned = new ImageEntity(this.imageFilename, this.name, {
      maxProgression: this.getMaxProgression(),
      disabled: this.isDisabled()
    });
    
    // Copy all properties down the inheritance chain
    this.cloneTo(cloned);
    
    return cloned;
  }

  /**
   * Copy this entity's image-specific properties to the target entity
   */
  protected cloneTo(target: ImageEntity): void {
    // Copy all inherited properties first
    super.cloneTo(target);
    
    // Copy image-specific properties
    target.image = this.image; // Share the same loaded image
    target.isImageLoaded = this.isImageLoaded;
  }

  // === Cleanup ===

  dispose(): void {
    // Don't dispose the image itself - AssetManager handles that
    this.image = null;
    this.isImageLoaded = false;
    super.dispose();
  }

  // === Debug Helpers ===

  toString(): string {
    const loadStatus = this.isImageLoaded ? '✅' : '❌';
    return `${super.toString()} ${loadStatus}${this.imageFilename}`;
  }

  getDebugInfo(): any {
    return {
      ...super.getDebugInfo(),
      image: {
        filename: this.imageFilename,
        loaded: this.isImageLoaded,
        dimensions: this.image ? `${this.image.width}x${this.image.height}` : 'unknown',
        aspectRatio: this.getAspectRatio().toFixed(2)
      }
    };
  }
}