import Entity from './Entity.js';

/**
 * Entity with transform properties for visual objects.
 * Handles position, scale, rotation, opacity and transform inheritance.
 */
class TransformEntity extends Entity {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    // Transform properties with defaults
    this.x = config.x !== undefined ? config.x : 0;
    this.y = config.y !== undefined ? config.y : 0;
    this.scaleX = config.scaleX !== undefined ? config.scaleX : 1;
    this.scaleY = config.scaleY !== undefined ? config.scaleY : 1;
    this.rotation = config.rotation !== undefined ? config.rotation : 0;
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    
    // Optional anchor point for transforms (0-1 normalized)
    this.anchorX = config.anchorX !== undefined ? config.anchorX : 0.5;
    this.anchorY = config.anchorY !== undefined ? config.anchorY : 0.5;
    
    // Size properties (can be set by subclasses)
    this.width = config.width || 0;
    this.height = config.height || 0;
  }
  
  /**
   * Draw this entity and its children with transform inheritance
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    //console.log(`TransformEntity: ${this.name} draw`);
    // Skip drawing if completely transparent
    if (this.opacity <= 0) {
      return;
    }
    
    ctx.save();
    this.applyTransform(ctx);
    
    // Draw children (they inherit our transforms)
    this.children.forEach(child => {
      if (child.draw && !child.disabled) {
        child.draw(ctx);
      }
    });
    
    ctx.restore();
  }
  
  /**
   * Apply this entity's transforms to the canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  applyTransform(ctx) {
    // Simple approach: just apply position and scale
    ctx.translate(this.x, this.y);
    ctx.scale(this.scaleX, this.scaleY);
    
    // Apply rotation around origin
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }
    
    // Apply opacity (multiplies with parent opacity)
    ctx.globalAlpha *= this.opacity;
  }
  
  /**
   * Get the scaled width of this entity
   * @returns {number} Width multiplied by scaleX
   */
  getScaledWidth() {
    return this.width * this.scaleX;
  }
  
  /**
   * Get the scaled height of this entity
   * @returns {number} Height multiplied by scaleY
   */
  getScaledHeight() {
    return this.height * this.scaleY;
  }
  
  /**
   * Get the world position (accounting for parent transforms)
   * Note: This is a simplified version - full implementation would need
   * to walk up the parent chain and apply all transforms
   * @returns {object} Object with x, y world coordinates
   */
  getWorldPosition() {
    if (!this.parent || !this.parent.getWorldPosition) {
      return { x: this.x, y: this.y };
    }
    
    const parentWorld = this.parent.getWorldPosition();
    return {
      x: parentWorld.x + this.x,
      y: parentWorld.y + this.y
    };
  }
  
  /**
   * Check if a point is within this entity's bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if point is within bounds
   */
  containsPoint(x, y) {
    const worldPos = this.getWorldPosition();
    const left = worldPos.x - (this.width * this.anchorX * this.scaleX);
    const top = worldPos.y - (this.height * this.anchorY * this.scaleY);
    const right = left + (this.width * this.scaleX);
    const bottom = top + (this.height * this.scaleY);
    
    return x >= left && x <= right && y >= top && y <= bottom;
  }
  
  /**
   * Get the bounds of this entity in world coordinates
   * @returns {object} Object with left, top, right, bottom properties
   */
  getBounds() {
    const worldPos = this.getWorldPosition();
    const left = worldPos.x - (this.width * this.anchorX * this.scaleX);
    const top = worldPos.y - (this.height * this.anchorY * this.scaleY);
    
    return {
      left: left,
      top: top,
      right: left + (this.width * this.scaleX),
      bottom: top + (this.height * this.scaleY),
      width: this.width * this.scaleX,
      height: this.height * this.scaleY
    };
  }
}

export default TransformEntity;