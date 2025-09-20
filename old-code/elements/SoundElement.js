// elements/SoundElement.js
import { BaseElement } from './BaseElement.js';
import { getSound } from '../core/mediaLoader.js';

export class SoundElement extends BaseElement {
  constructor(soundName) {
    super();
    
    // Sound properties
    this.soundName = soundName;
    this.sound = getSound(soundName);
    this.volume = 1;
    this.loop = false;
  }
  
  /**
   * Play the sound
   */
  play() {
    if (this.sound) {
      this.sound.volume = this.volume;
      this.sound.loop = this.loop;
      this.sound.play();
    }
  }
  
  /**
   * Stop the sound
   */
  stop() {
    if (this.sound) {
      this.sound.pause();
      this.sound.currentTime = 0;
    }
  }
  
  /**
   * SoundElement doesn't render anything to canvas
   */
  draw(ctx) {
    // Sound elements don't draw anything
  }
}
