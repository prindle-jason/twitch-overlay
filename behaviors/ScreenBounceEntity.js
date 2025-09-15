import Entity from '../entities/Entity.js';

/**
 * Behavior entity that makes a parent entity bounce off screen edges.
 * Adds physics simulation with wall collision detection.
 */
export default class ScreenBounceEntity extends Entity {
  constructor(config = {}) {
    super(config);
    
    this.screenWidth = config.screenWidth || 800;
    this.screenHeight = config.screenHeight || 600;
    this.velocityX = config.velocityX || 2;
    this.velocityY = config.velocityY || 2;
  }
  
  /**
   * Update parent position and handle bouncing
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    if (!this.parent) return;
    
    const speedScale = deltaTime / 16.67; // Normalize to 60fps
    
    // Update parent position based on velocity
    this.parent.x += this.velocityX * speedScale;
    this.parent.y += this.velocityY * speedScale;
    
    // Handle wall collisions and bounce
    if (this.parent.x < 0) {
      this.parent.x = 0;
      this.velocityX = Math.abs(this.velocityX);
    } else if (this.parent.x + this.parent.width > this.screenWidth) {
      this.parent.x = this.screenWidth - this.parent.width;
      this.velocityX = -Math.abs(this.velocityX);
    }
    
    if (this.parent.y < 0) {
      this.parent.y = 0;
      this.velocityY = Math.abs(this.velocityY);
    } else if (this.parent.y + this.parent.height > this.screenHeight) {
      this.parent.y = this.screenHeight - this.parent.height;
      this.velocityY = -Math.abs(this.velocityY);
    }
  }
}