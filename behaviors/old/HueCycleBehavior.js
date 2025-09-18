// behaviors/HueCycleBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class HueCycleBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.hueIncrement = config.hueIncrement || 0.5;
  }
  
  onPlay(element) {
    // Initialize hue if not already set
    if (element.hue === undefined) {
      element.hue = Math.random() * 360;
    }
  }
  
  update(element, deltaTime) {
    const speedScale = deltaTime / 16.67;
    element.hue = (element.hue + this.hueIncrement * speedScale) % 360;
    
    // Apply hue rotation filter
    element.filter = `hue-rotate(${element.hue}deg)`;
  }
}
