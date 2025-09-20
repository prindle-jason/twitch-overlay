// elements/EllipseElement.js
import { BaseElement } from './BaseElement.js';

export class EllipseElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    
    // Position
    this.x = config.x || 0;
    this.y = config.y || 0;
    
    // Shape
    this.radiusX = config.radiusX || 10;
    this.radiusY = config.radiusY || this.radiusX; // Defaults to circle
    this.rotation = config.rotation || 0;
    
    // Visual
    this.color = config.color || '#ffffff';
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
  }
  
  /**
   * Draw the ellipse to the canvas
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (this.opacity <= 0) return;
    
    ctx.save();
    
    // Apply opacity
    ctx.globalAlpha = this.opacity;
    
    // Draw ellipse
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, this.rotation, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Check if this element is completely off-screen
   * @param {number} screenWidth 
   * @param {number} screenHeight 
   * @returns {boolean}
   */
  isOffScreen(screenWidth, screenHeight) {
    const margin = Math.max(this.radiusX, this.radiusY) + 10;
    return this.x < -margin || 
           this.x > screenWidth + margin || 
           this.y < -margin || 
           this.y > screenHeight + margin;
  }
}
