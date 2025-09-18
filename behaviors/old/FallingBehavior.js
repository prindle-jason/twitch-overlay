// behaviors/FallingBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class FallingBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    
    // Initial velocity
    this.velocityY = config.velocityY || 0;
    
    // Gravity (pixels per second squared)
    this.gravity = config.gravity || 200;
    
    // Optional horizontal drift
    this.velocityX = config.velocityX || 0;
    this.drag = config.drag || 0; // Air resistance factor (0-1)
  }
  
  update(element, deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    // Apply gravity to vertical velocity
    this.velocityY += this.gravity * deltaSeconds;
    
    // Apply drag to both velocities
    if (this.drag > 0) {
      this.velocityX *= Math.pow(1 - this.drag, deltaSeconds);
      this.velocityY *= Math.pow(1 - this.drag, deltaSeconds);
    }
    
    // Update position based on velocity
    element.x += this.velocityX * deltaSeconds;
    element.y += this.velocityY * deltaSeconds;
  }
}
