import TransformEntity from './TransformEntity.js';
import { getImage } from '../core/mediaLoader.js';

/**
 * Entity that displays a single image.
 * Gets images from mediaLoader by name.
 */
export default class ImageEntity extends TransformEntity {
  constructor(config = {}) {
    super(config);
    
    this.imageName = config.imageName || null;
    this.image = null;


    if (this.imageName) {
      this.image = getImage(this.imageName);
      
      if (this.image) {        
        // Set dimensions if not specified
        if (this.width === 0) {
          this.width = this.image.width;
        }
        if (this.height === 0) {
          this.height = this.image.height;
        }
      } else {
        console.warn(`Image '${this.imageName}' not found in mediaLoader`);
      }
    }
  }
  
  /**
   * Draw the image and its children
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    // Skip drawing if completely transparent
    if (this.opacity <= 0) {
      return;
    }
    
    ctx.save();
    this.applyTransform(ctx);
    
    // Draw the image first
    this.drawSelf(ctx);
    
    // Then draw children (they inherit our transforms)
    this.children.forEach(child => {
      if (child.draw && !child.disabled) {
        child.draw(ctx);
      }
    });
    
    ctx.restore();
  }
  
  /**
   * Draw the image
   * @param {CanvasRenderingContext2D} ctx - Canvas context (already transformed)
   */
  drawSelf(ctx) {
    if (!this.image) {
      return;
    }
    
    try {
      // Draw using anchor-based positioning
      const drawX = -this.width * this.anchorX;
      const drawY = -this.height * this.anchorY;
      ctx.filter = this.filter || 'none';
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(
        this.image,
        drawX, drawY, this.width, this.height
      );
    } catch (e) {
      console.error(`Error drawing image '${this.imageName}':`, e);
    }
  }
  
  /**
   * Check if the image is available
   * @returns {boolean} True if image is available
   */
  isReady() {
    return !!this.image;
  }
  
  /**
   * Get the natural size of the image
   * @returns {object} Object with width and height properties
   */
  getNaturalSize() {
    if (!this.image) {
      return { width: 0, height: 0 };
    }
    return {
      width: this.image.width,
      height: this.image.height
    };
  }
}