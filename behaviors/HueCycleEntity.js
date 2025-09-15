import Entity from '../entities/Entity.js';

/**
 * Behavior entity that cycles the hue of the parent entity.
 * Creates rainbow color cycling effect.
 */
export default class HueCycleEntity extends Entity {
  constructor(config = {}) {
    super(config);
    
    this.hueIncrement = config.hueIncrement || 0.5;
    this.currentHue = config.startHue || Math.random() * 360;
  }
  
  /**
   * Initialize hue on parent
   */
  onPlay() {
    if (this.parent && this.parent.drawSelf) {
      // Store original drawSelf method
      this.originalDrawSelf = this.parent.drawSelf.bind(this.parent);
      
      // Override parent's drawSelf to apply hue rotation
      this.parent.drawSelf = (ctx) => {
        ctx.save();
        ctx.filter = `hue-rotate(${this.currentHue}deg)`;
        this.originalDrawSelf(ctx);
        ctx.restore();
      };
    }
  }
  
  /**
   * Update hue cycling
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    const speedScale = deltaTime / 16.67; // Normalize to 60fps
    this.currentHue = (this.currentHue + this.hueIncrement * speedScale) % 360;
  }
  
  /**
   * Restore original drawSelf when finished
   */
  onFinish() {
    if (this.parent && this.originalDrawSelf) {
      this.parent.drawSelf = this.originalDrawSelf;
    }
  }
}