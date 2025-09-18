// behaviors/ImageJitterBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class ImageJitterBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.jitterAmount = config.jitterAmount || 6;
    this.baseX = 0;
    this.baseY = 0;
  }
  
  onPlay(element) {
    // Store the base position - this never changes
    this.baseX = element.x;
    this.baseY = element.y;
  }
  
  update(element, deltaTime) {
    // Always jitter around the original base position
    element.x = this.baseX + (Math.random() - 0.5) * this.jitterAmount * 2;
    element.y = this.baseY + (Math.random() - 0.5) * this.jitterAmount * 2;
  }
}
