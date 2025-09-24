// elements/BoxElement.js
import { BaseElement } from './BaseElement.js';

export class BoxElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    
    // Position and size
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 100;
    this.height = config.height || 50;
    
    // Fill properties
    this.fillColor = config.fillColor || '#000000';
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    
    // Border properties
    this.borderTopColor = config.borderTopColor || '#ffffff';
    this.borderBottomColor = config.borderBottomColor || config.borderTopColor || '#ffffff';
    this.borderTopWidth = config.borderTopWidth || 0;
    this.borderBottomWidth = config.borderBottomWidth || config.borderTopWidth || 0;
    
    // Optional left/right borders (usually set to 0 for ticker)
    this.borderLeftColor = config.borderLeftColor || '#ffffff';
    this.borderRightColor = config.borderRightColor || config.borderLeftColor || '#ffffff';
    this.borderLeftWidth = config.borderLeftWidth || 0;
    this.borderRightWidth = config.borderRightWidth || config.borderLeftWidth || 0;
  }
  
  /**
   * Get the actual width (accounting for borders)
   */
  getTotalWidth() {
    return this.width + this.borderLeftWidth + this.borderRightWidth;
  }
  
  /**
   * Get the actual height (accounting for borders)
   */
  getTotalHeight() {
    return this.height + this.borderTopWidth + this.borderBottomWidth;
  }
  
  /**
   * Draw the box to the canvas
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (this.opacity <= 0) return;
    
    ctx.save();
    
    // Apply opacity
    ctx.globalAlpha = this.opacity;
    
    // Draw the main fill
    if (this.fillColor) {
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    // Draw borders
    // Top border
    if (this.borderTopWidth > 0) {
      ctx.fillStyle = this.borderTopColor;
      ctx.fillRect(
        this.x - this.borderLeftWidth, 
        this.y - this.borderTopWidth, 
        this.width + this.borderLeftWidth + this.borderRightWidth, 
        this.borderTopWidth
      );
    }
    
    // Bottom border
    if (this.borderBottomWidth > 0) {
      ctx.fillStyle = this.borderBottomColor;
      ctx.fillRect(
        this.x - this.borderLeftWidth, 
        this.y + this.height, 
        this.width + this.borderLeftWidth + this.borderRightWidth, 
        this.borderBottomWidth
      );
    }
    
    // Left border
    if (this.borderLeftWidth > 0) {
      ctx.fillStyle = this.borderLeftColor;
      ctx.fillRect(
        this.x - this.borderLeftWidth, 
        this.y - this.borderTopWidth, 
        this.borderLeftWidth, 
        this.height + this.borderTopWidth + this.borderBottomWidth
      );
    }
    
    // Right border
    if (this.borderRightWidth > 0) {
      ctx.fillStyle = this.borderRightColor;
      ctx.fillRect(
        this.x + this.width, 
        this.y - this.borderTopWidth, 
        this.borderRightWidth, 
        this.height + this.borderTopWidth + this.borderBottomWidth
      );
    }
    
    ctx.restore();
  }
}