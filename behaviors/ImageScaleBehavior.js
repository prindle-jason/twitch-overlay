// behaviors/ImageScaleBehavior.js
import { BaseBehavior } from './BaseBehavior.js';

export class ImageScaleBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.scaleX = config.scaleX || 1;
    this.scaleY = config.scaleY || config.scaleX || 1;
  }
  
  onPlay(element) {
    element.scaleX = this.scaleX;
    element.scaleY = this.scaleY;
  }
}
