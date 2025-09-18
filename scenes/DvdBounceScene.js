import SceneEntity from '../entities/SceneEntity.js';
import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import ScreenBounceBehavior from '../behaviors/ScreenBounceBehavior.js';
import ScreenCornerDetectionBehavior from '../behaviors/ScreenCornerDetectionBehavior.js';
import HueCycleBehavior from '../behaviors/HueCycleBehavior.js';
import FinishAfterDurationBehavior from '../behaviors/FinishAfterDurationBehavior.js';

/**
 * DVD bouncing logo scene.
 * Logo bounces around screen until it hits a corner, then starts a timer and finishes after 2 seconds.
 */
export default class DvdBounceScene extends SceneEntity {
  constructor(screenWidth, screenHeight, config = {}) {
    super(screenWidth, screenHeight, config);

    this.cornerReached = false;
    
    // Initialize the scene
    this.setupLogo();
    this.setupAudio();

    this.finishTimer = new FinishAfterDurationBehavior({
      duration: 2000,
      disabled: true
    }, this);
    this.addChild(this.finishTimer);
  }
  
  /**
   * Create and configure the DVD logo with behaviors
   */
  setupLogo() {
    // Create the DVD logo
    this.logo = new ImageEntity({
      imageName: 'dvdLogo',
      width: 128,
      height: 56,
      // DEBUG: Position logo to travel directly to bottom-right corner
      // With default anchor (0.5, 0.5) and velocity (2, 2)
      x: this.screenWidth - 236,  // Close enough to corner to reach it quickly
      y: this.screenHeight - 200   // Close enough to corner to reach it quickly
      // x: Math.random() * (this.screenWidth - 128),
      // y: Math.random() * (this.screenHeight - 56)
    });
    
    // Add bouncing physics behavior
    const bounceBehavior = new ScreenBounceBehavior({
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      velocityX: 2.0,
      velocityY: 2.0
    }, this.logo);
    
    // Add corner detection behavior
    this.cornerDetector = new ScreenCornerDetectionBehavior({
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      epsilon: 2
    }, this.logo);
    
    // Add hue cycling behavior for rainbow effect
    const hueCycleBehavior = new HueCycleBehavior({
      hueIncrement: 0.5
    }, this.logo);
    
    // Attach behaviors to logo
    this.logo.addChild(bounceBehavior);
    this.logo.addChild(this.cornerDetector);
    this.logo.addChild(hueCycleBehavior);
    
    // Add logo to scene
    this.addChild(this.logo);
  }
  
  /**
   * Setup audio for corner hit celebration
   */
  setupAudio() {
    // Create sound for corner hits (disabled until corner is hit)
    this.cornerSound = AudioEntity.createOnPlayEntity('partyHorn', {//new AudioEntity({
      volume: 0.4,
      disabled: true
    });
    
    this.addChild(this.cornerSound);
  }
  
  /**
   * Handle logo reaching corner
   */
  onUpdate(deltaTime) {
    super.onUpdate(deltaTime);
    
    // Check if corner was reached
    if (!this.cornerReached && this.cornerDetector && this.cornerDetector.cornerReached) {
      this.handleCornerHit();
    }
  }
  
  /**
   * Handle corner hit - enable audio and start finish timer
   */
  handleCornerHit() {
    console.log('DvdBounceScene: Corner hit detected!');
    this.cornerReached = true;

    this.logo.disable();
    // Enable and play celebration sound
    if (this.cornerSound) {
      this.cornerSound.enable();
    }
    this.finishTimer.enable();
  }
}