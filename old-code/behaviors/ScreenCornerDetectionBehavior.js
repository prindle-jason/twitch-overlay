import BaseBehavior from './BaseBehavior.js';

/**
 * Behavior entity that detects when parent entity reaches screen corners.
 * Triggers parent finish when corner is reached.
 */
export default class ScreenCornerDetectionBehavior extends BaseBehavior {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
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
    
    // Use edge calculation methods that account for anchors
    const leftEdge = this.parent.getLeftEdge();
    const rightEdge = this.parent.getRightEdge();
    const topEdge = this.parent.getTopEdge();
    const bottomEdge = this.parent.getBottomEdge();
    
    // Check if element is at any corner (within epsilon tolerance)
    const atLeft = leftEdge <= this.epsilon;
    const atRight = rightEdge >= this.screenWidth - this.epsilon;
    const atTop = topEdge <= this.epsilon;
    const atBottom = bottomEdge >= this.screenHeight - this.epsilon;
    
    const isInCorner = (atLeft && atTop) || 
                      (atRight && atTop) || 
                      (atLeft && atBottom) || 
                      (atRight && atBottom);
    
    if (isInCorner) {
      console.log('ScreenCornerDetectionBehavior: Corner reached!');
      this.cornerReached = true;
    }
  }
}