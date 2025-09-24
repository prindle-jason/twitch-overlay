// effects/BamUhOhEffect.js
import { BaseEffect } from './BaseEffect.js';
import { ImageElement } from '../elements/ImageElement.js';
import { SoundElement } from '../elements/SoundElement.js';
import { ImageScaleBehavior } from '../behaviors/ImageScaleBehavior.js';
import { SlideBehavior } from '../behaviors/SlideBehavior.js';
import { SoundOnPlayBehavior } from '../behaviors/SoundOnPlayBehavior.js';

export class BamUhOhEffect extends BaseEffect {
  constructor({ W, H, duration = 5000 }) {
    super({ W, H, duration });
    
    const SCALE = 0.25;
    
    // Create Bub image (slides from left)
    const bubImage = new ImageElement('bubFailure');
    bubImage.addBehavior(new ImageScaleBehavior({ scaleX: SCALE, scaleY: SCALE }));
    
    // Calculate dimensions for positioning
    const imgW = bubImage.image.naturalWidth * SCALE;
    const imgH = bubImage.image.naturalHeight * SCALE;
    
    bubImage.addBehavior(new SlideBehavior({
      startX: 0 - imgW,  // Off screen left
      startY: H,
      endX: 0,
      endY: H - imgH,
      fadeTime: 0.2
    }));
    
    // Create Bob image (slides from right)
    const bobImage = new ImageElement('bobFailure');
    bobImage.addBehavior(new ImageScaleBehavior({ scaleX: SCALE, scaleY: SCALE }));
    bobImage.addBehavior(new SlideBehavior({
      startX: W,  // Off screen right
      startY: H,
      endX: W - imgW,  // Right edge minus image width
      endY: H - imgH,
      fadeTime: 0.2
    }));
    
    // Create sound element
    const sound = new SoundElement('bamUhOh');
    sound.addBehavior(new SoundOnPlayBehavior());
    
    // Add all elements to the effect
    this.addElement(bubImage);
    this.addElement(bobImage);
    this.addElement(sound);
  }
}
