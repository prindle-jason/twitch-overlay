import Entity from './Entity.js';
import { getSound } from '../core/mediaLoader.js';
import AudioStartOnPlayBehavior from '../behaviors/AudioStartOnPlayBehavior.js';

/**
 * Entity for audio playback.
 * Has no transform properties since audio has no spatial position.
 * Can still have children (visual effects that sync to audio).
 */
export default class AudioEntity extends Entity {
  constructor(config = {}) {
    super(config);
    
    this.audioName = config.audioName || null;
    this.audio = null;
    this.volume = config.volume !== undefined ? config.volume : 1.0;
    
    console.log(`AudioEntity: ${this.name} constructor audioName=${this.audioName}`);
    
    if (this.audioName) {
      this.audio = getSound(this.audioName);
      
      if (this.audio) {
        this.audio.volume = this.volume;
        console.log(`Audio '${this.audioName}' loaded from mediaLoader`);
      } else {
        console.warn(`Audio '${this.audioName}' not found in mediaLoader`);
      }
    }
  }
  
  /**
   * Static helper to create an AudioEntity that auto-plays on scene start
   * @param {string} audioName - Name of the audio resource to play
   * @param {Object} options - Optional config (volume, etc.)
   * @returns {AudioEntity} AudioEntity with AudioStartOnPlayBehavior attached
   */
  static createOnPlayEntity(audioName, options = {}) {
    const audio = new AudioEntity({
      audioName: audioName,
      volume: options.volume,
      disabled: options.disabled || false,
    });
    
    const autoPlayBehavior = new AudioStartOnPlayBehavior({}, audio);
    audio.addChild(autoPlayBehavior);
    
    return audio;
  }
  
  /**
   * Check if audio should finish naturally
   * @returns {boolean} True if audio has ended
   */
  shouldFinish() {
    return this.audio && this.audio.ended;
  }

  enable() {
    console.log(`AudioEntity: ${this.name} enabled`);
    super.enable();
    //this.playAudio();
  }
  
  /**
   * Start audio playback
   */
  playAudio() {
    console.log(`AudioEntity: ${this.name} playAudio`);
    if (this.audio) {
      try {
        const playPromise = this.audio.play();
        console.log(`Audio duration: ${this.audio.duration}s`);
        if (playPromise) {
          playPromise.catch(e => {
            console.warn(`Audio play failed: ${this.audioName}`, e);
          });
        }
      } catch (e) {
        console.warn(`Audio play failed: ${this.audioName}`, e);
      }
    }
  }
  
  /**
   * Stop audio playback
   */
  stopAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
  
  /**
   * Set audio volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }
}