import Entity from '../entities/Entity.js';

/**
 * Behavior entity that detects when parent entity reaches screen corners.
 * Triggers parent finish when corner is reached.
 */
export default class ScreenCornerDetectionEntity extends Entity {
  constructor(config = {}) {
    super(config);
    
    this.screenWidth = config.screenWidth || 800;
    this.screenHeight = config.screenHeight || 600;
    this.epsilon = config.epsilon || 2;
    this.cornerReached = false;
  }
  
  /**
   * Check for corner collision and finish parent if detected
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    if (!this.parent || this.cornerReached) return;
    
    const x = this.parent.x;
    const y = this.parent.y;
    const width = this.parent.width;
    const height = this.parent.height;
    
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
      // Finish the parent entity
      this.parent.finish();
    }
  }
}