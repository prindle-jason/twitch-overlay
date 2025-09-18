// behaviors/ImageBlurInOutBehavior.js
import { BaseBehavior } from './BaseBehavior.js';
import { getEaseInOutProgress } from '../utils/progressUtils.js';

export class ImageBlurInOutBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.maxBlur = config.maxBlur || 16;
    this.fadeTime = config.fadeTime || 0.4;
  }
  
  apply(element) {
    // Get progress from the element (works for both effect-timed and element-timed)
    const progress = element.getProgress();
    const alpha = getEaseInOutProgress(progress, this.fadeTime);
    const blurPx = this.maxBlur * (1 - alpha);
    element.filter = `blur(${blurPx}px)`;
  }
  
  onPlay(element) {
    this.apply(element);
  }
  
  update(element, deltaTime) {
    this.apply(element);
  }
}
