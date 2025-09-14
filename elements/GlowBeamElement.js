// elements/GlowBeamElement.js
import { BaseElement } from './BaseElement.js';

export class GlowBeamElement extends BaseElement {
  constructor(config = {}) {
    super(config);
    
    // Position (beam tip point)
    this.x = config.x || 0;
    this.y = config.y || 0;
    
    // Beam geometry
    this.length = config.length || 150;
    this.baseWidth = config.baseWidth || 30;
    this.angle = config.angle || 0; // radians, 0 = pointing up (beam extends down from tip)
    
    // Visual properties
    this.color = config.color || 'rgba(255, 255, 180, 1)';
    this.intensity = config.intensity !== undefined ? config.intensity : 1;
    this.opacity = config.opacity !== undefined ? config.opacity : 0.7;
    this.blur = config.blur || 0;
    this.fadeDistance = config.fadeDistance !== undefined ? config.fadeDistance : 0.7;
    
    // Cached gradient (for performance)
    this._cachedGradient = null;
    this._lastGradientParams = null;
  }
  
  /**
   * Create or get cached gradient for the beam
   * @param {CanvasRenderingContext2D} ctx 
   * @returns {CanvasGradient}
   */
  _getGradient(ctx) {
    // Calculate base position (opposite from tip)
    const baseX = this.x - Math.sin(this.angle) * this.length;
    const baseY = this.y + Math.cos(this.angle) * this.length;
    
    // Create cache key
    const gradientParams = `${this.x},${this.y},${baseX},${baseY},${this.color},${this.intensity},${this.fadeDistance}`;
    
    // Return cached gradient if parameters haven't changed
    if (this._cachedGradient && this._lastGradientParams === gradientParams) {
      return this._cachedGradient;
    }
    
    // Create new gradient from tip to base (tip=opaque, base=transparent)
    const gradient = ctx.createLinearGradient(this.x, this.y, baseX, baseY);
    
    // Parse base color and apply intensity
    const baseAlpha = this._parseAlpha(this.color) * this.intensity;
    const baseColor = this._replaceAlpha(this.color, baseAlpha);
    const fadeColor = this._replaceAlpha(this.color, baseAlpha * 0.3);
    const transparentColor = this._replaceAlpha(this.color, 0);
    
    console.log('Gradient colors:', this.color, baseColor, fadeColor, transparentColor);
    gradient.addColorStop(0, baseColor); // Opaque at tip
    gradient.addColorStop(this.fadeDistance, fadeColor);
    gradient.addColorStop(1, transparentColor); // Transparent at base/far end
    
    // Cache the gradient
    this._cachedGradient = gradient;
    this._lastGradientParams = gradientParams;
    
    return gradient;
  }
  
  /**
   * Parse alpha value from rgba color string
   * @param {string} color - rgba color string
   * @returns {number} - alpha value (0-1)
   */
  _parseAlpha(color) {
    const match = color.match(/rgba?\([^)]*,\s*([^)]+)\)/);
    return match ? parseFloat(match[1]) : 1;
  }
  
  /**
   * Replace alpha value in rgba color string
   * @param {string} color - rgba color string
   * @param {number} alpha - new alpha value (0-1)
   * @returns {string} - new rgba color string
   */
  _replaceAlpha(color, alpha) {
    if (color.includes('rgba')) {
      // Extract RGB values and replace alpha
      const match = color.match(/rgba\(([^,]+),\s*([^,]+),\s*([^,]+),\s*[^)]+\)/);
      if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
      }
    } else if (color.includes('rgb')) {
      // Convert rgb to rgba with new alpha
      const match = color.match(/rgb\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      if (match) {
        return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
      }
    }
    return color; // Fallback for other color formats
  }
  
  /**
   * Draw the beam to the canvas
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    //if (this.opacity <= 0 || this.intensity <= 0) return;
    
    ctx.save();
    
    // Apply opacity and blur
    ctx.globalAlpha = this.opacity;
    if (this.blur > 0) {
      ctx.filter = `blur(${this.blur}px)`;
    }
    
    // Calculate base position (opposite from tip)
    const baseX = this.x - Math.sin(this.angle) * this.length;
    const baseY = this.y + Math.cos(this.angle) * this.length;
    
    //console.log('Beam tip:', this.x, this.y, 'Base:', baseX, baseY);

    // Calculate base corners (perpendicular to beam direction)
    const perpAngle = this.angle + Math.PI / 2;
    //console.log('Angle: ', this.angle, 'Perp angle: ', perpAngle);
    const baseLeftX = baseX + Math.sin(perpAngle) * (this.baseWidth / 2);
    const baseLeftY = baseY + Math.cos(perpAngle) * (this.baseWidth / 2);
    const baseRightX = baseX - Math.sin(perpAngle) * (this.baseWidth / 2);
    const baseRightY = baseY - Math.cos(perpAngle) * (this.baseWidth / 2);
    
    //console.log('Beam base corners:', baseLeftX, baseLeftY, baseRightX, baseRightY);

    // Create triangle path
    ctx.beginPath();
    ctx.moveTo(baseLeftX, baseLeftY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.lineTo(this.x, this.y); // tip
    ctx.closePath();
    
    // Fill with solid red for testing
    ctx.fillStyle = this._getGradient(ctx);
    ctx.fill();
    
    // Reset filter
    //ctx.filter = 'none';
    ctx.restore();
  }
  
  /**
   * Get the effective width of the beam (for positioning/collision)
   * @returns {number}
   */
  getWidth() {
    return this.baseWidth;
  }
  
  /**
   * Get the effective height of the beam (for positioning/collision)
   * @returns {number}
   */
  getHeight() {
    return this.length;
  }
}
