// behaviors/ImageFadeInOutBehavior.js
import { BaseBehavior } from './BaseBehavior.js';
import { getEaseInOutProgress } from '../utils/progressUtils.js';

export class ImageFadeInOutBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.fadeTime = config.fadeTime || 0.25;
  }
  
  apply(element) {
    // Get progress from the element (works for both effect-timed and element-timed)
    const progress = element.getProgress();
    
    // Apply fade in/out curve to opacity
    element.opacity = getEaseInOutProgress(progress, this.fadeTime);
  }
  
  onPlay(element) {
    this.apply(element);
  }
  
  update(element, deltaTime) {
    this.apply(element);
  }
}
