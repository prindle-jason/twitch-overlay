// effects/ComposableDvdEffect.js
import { BaseEffect } from './BaseEffect.js';
import { ImageElement } from '../elements/ImageElement.js';
import { SoundElement } from '../elements/SoundElement.js';
import { ScreenBounceBehavior } from '../behaviors/ScreenBounceBehavior.js';
import { ScreenCornerDetectionBehavior } from '../behaviors/ScreenCornerDetectionBehavior.js';
import { HueCycleBehavior } from '../behaviors/HueCycleBehavior.js';
import { SoundOnFinishBehavior } from '../behaviors/SoundOnFinishBehavior.js';
import { SoundOnPlayBehavior } from '../behaviors/SoundOnPlayBehavior.js';

export class DvdEffect extends BaseEffect {
  constructor({ W, H, spawn }) {
    super({ W, H, duration: -1 }); // Infinite duration until corner hit
    this.spawn = spawn;
    
    // Create the DVD logo element with weighted random selection
    const logoOptions = [ 'dvdLogo', 'bluRayLogo' ];
    const soundOptions = [ 'partyHorn', 'yippee' ];

    const selection = Math.random() < 0.9 ? 0 : 1;

    const logo = new ImageElement(logoOptions[selection]);
    logo.width = 128;
    logo.height = 56;
    logo.x = Math.random() * (W - logo.width);
    logo.y = Math.random() * (H - logo.height);
    
    // Add bouncing physics behavior
    const bounceBehavior = new ScreenBounceBehavior({
      screenWidth: W,
      screenHeight: H,
      velocityX: 2.0,
      velocityY: 2.0
    });
    
    // Add corner detection behavior
    this.cornerDetector = new ScreenCornerDetectionBehavior({
      screenWidth: W,
      screenHeight: H,
      epsilon: 2
    });
    
    // Add hue cycling behavior
    const hueCycleBehavior = new HueCycleBehavior({
      hueIncrement: 0.5
    });
    
    // Attach behaviors to logo
    logo.addBehavior(bounceBehavior);
    logo.addBehavior(this.cornerDetector);
    logo.addBehavior(hueCycleBehavior);
    
    // Add logo to effect
    this.addElement(logo);
    
    // Create sound element for corner hits with finish behavior
    const sound = new SoundElement(soundOptions[selection]);
    sound.addBehavior(new SoundOnFinishBehavior({ volume: 0.4 }));
    this.addElement(sound);
  }
  
  update(deltaTime) {
    // Update all elements first
    super.update(deltaTime);
    
    // Check if corner was reached
    if (this.cornerDetector.cornerReached) {
      // Finish the effect (this will trigger onFinish)
      this.state = "Finished";
    }
  }
  
  onFinish() {
    // Spawn confetti if callback provided
    if (this.spawn) {
      this.spawn("confetti");
    }
    
    // Call parent onFinish to trigger element behaviors
    super.onFinish();
  }
}
