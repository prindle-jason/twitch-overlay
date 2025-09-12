// behaviors/ScreenBounceBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class ScreenBounceBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.screenWidth = config.screenWidth || 800;
    this.screenHeight = config.screenHeight || 600;
    this.velocityX = config.velocityX || 2;
    this.velocityY = config.velocityY || 2;
  }
  
  update(element, deltaTime) {
    const speedScale = deltaTime / 16.67;
    
    // Update position based on velocity
    element.x += this.velocityX * speedScale;
    element.y += this.velocityY * speedScale;
    
    // Handle wall collisions and bounce
    if (element.x < 0) {
      element.x = 0;
      this.velocityX = Math.abs(this.velocityX);
    } else if (element.x + element.width > this.screenWidth) {
      element.x = this.screenWidth - element.width;
      this.velocityX = -Math.abs(this.velocityX);
    }
    
    if (element.y < 0) {
      element.y = 0;
      this.velocityY = Math.abs(this.velocityY);
    } else if (element.y + element.height > this.screenHeight) {
      element.y = this.screenHeight - element.height;
      this.velocityY = -Math.abs(this.velocityY);
    }
  }
}
