// behaviors/TiltBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class TiltBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    
    // Rotation speed (radians per second)
    this.rotationSpeed = config.rotationSpeed || 1;
    
    // Optional wobble effect
    this.wobbleAmount = config.wobbleAmount || 0;
    this.wobbleSpeed = config.wobbleSpeed || 2;
    this.wobbleOffset = Math.random() * Math.PI * 2; // Random start phase
  }
  
  update(element, deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    // Basic rotation
    element.rotation += this.rotationSpeed * deltaSeconds;
    
    // Optional wobble effect
    if (this.wobbleAmount > 0) {
      const wobble = Math.sin((Date.now() / 1000) * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmount;
      element.rotation += wobble * deltaSeconds;
    }
    
    // Keep rotation in reasonable range
    while (element.rotation > Math.PI * 2) {
      element.rotation -= Math.PI * 2;
    }
    while (element.rotation < 0) {
      element.rotation += Math.PI * 2;
    }
  }
}
