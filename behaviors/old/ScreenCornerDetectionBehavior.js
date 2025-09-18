// behaviors/ScreenCornerDetectionBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class ScreenCornerDetectionBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.screenWidth = config.screenWidth || 800;
    this.screenHeight = config.screenHeight || 600;
    this.epsilon = config.epsilon || 2;
    this.cornerReached = false;
  }
  
  update(element, deltaTime) {
    // Only check if we haven't already detected a corner
    if (this.cornerReached) return;
    
    const x = element.x;
    const y = element.y;
    const width = element.width;
    const height = element.height;
    
    // Check if element is at any corner
    const atLeft = x <= this.epsilon;
    const atRight = x + width >= this.screenWidth - this.epsilon;
    const atTop = y <= this.epsilon;
    const atBottom = y + height >= this.screenHeight - this.epsilon;
    
    const isInCorner = (atLeft && atTop) || 
                      (atRight && atTop) || 
                      (atLeft && atBottom) || 
                      (atRight && atBottom);
    
    if (isInCorner) {
      this.cornerReached = true;
    }
  }
}
