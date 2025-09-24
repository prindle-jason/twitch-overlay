// behaviors/SlideBehavior.js
import { BaseBehavior } from './BaseBehavior.js';
import { getEaseInOutProgress } from '../utils/progressUtils.js';

export class SlideBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.startX = config.startX || 0;
    this.startY = config.startY || 0;
    this.endX = config.endX || 0;
    this.endY = config.endY || 0;
    this.fadeTime = config.fadeTime || 0.2;
  }
  
  onPlay(element) {
    element.x = this.startX;
    element.y = this.startY;
  }
  
  update(element, deltaTime) {
    const progress = element.effect.getProgress();
    // Use fadeInOut curve but invert it for sliding motion
    const slide = 1 - getEaseInOutProgress(progress, this.fadeTime);
    
    element.x = this.startX + (this.endX - this.startX) * (1 - slide);
    element.y = this.startY + (this.endY - this.startY) * (1 - slide);
  }
}