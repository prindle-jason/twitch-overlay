import BaseBehavior from './BaseBehavior.js';

/**
 * Behavior entity that makes a parent entity bounce off screen edges.
 * Adds physics simulation with wall collision detection.
 */
export default class ScreenBounceBehavior extends BaseBehavior {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
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
    
    // Handle wall collisions and bounce using edge calculation methods
    if (this.parent.getLeftEdge() < 0) {
      this.parent.x = this.parent.width * this.parent.anchorX;
      this.velocityX = Math.abs(this.velocityX);
    } else if (this.parent.getRightEdge() > this.screenWidth) {
      this.parent.x = this.screenWidth - (this.parent.width * (1 - this.parent.anchorX));
      this.velocityX = -Math.abs(this.velocityX);
    }
    
    if (this.parent.getTopEdge() < 0) {
      this.parent.y = this.parent.height * this.parent.anchorY;
      this.velocityY = Math.abs(this.velocityY);
    } else if (this.parent.getBottomEdge() > this.screenHeight) {
      this.parent.y = this.screenHeight - (this.parent.height * (1 - this.parent.anchorY));
      this.velocityY = -Math.abs(this.velocityY);
    }
  }
}