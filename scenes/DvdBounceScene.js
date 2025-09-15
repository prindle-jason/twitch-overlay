import Entity from '../entities/Entity.js';
import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import ScreenBounceEntity from '../behaviors/ScreenBounceEntity.js';
import ScreenCornerDetectionEntity from '../behaviors/ScreenCornerDetectionEntity.js';
import HueCycleEntity from '../behaviors/HueCycleEntity.js';

/**
 * DVD bouncing logo scene.
 * Logo bounces around screen until it hits a corner, then triggers confetti.
 */
export default class DvdBounceScene extends Entity {
  constructor(config = {}) {
    super(config);
    
    this.screenWidth = config.screenWidth || 800;
    this.screenHeight = config.screenHeight || 600;
    this.onCornerHit = config.onCornerHit || null;
    
    // Initialize the scene
    this.setupLogo();
    this.setupAudio();
  }
  
  /**
   * Create and configure the DVD logo with behaviors
   */
  setupLogo() {
    // Create the DVD logo
    this.logo = new ImageEntity('resources/images/dvdLogo.png', {
      width: 128,
      height: 56,
      x: Math.random() * (this.screenWidth - 128),
      y: Math.random() * (this.screenHeight - 56)
    });
    
    // Add bouncing physics behavior
    const bounceBehavior = new ScreenBounceEntity({
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      velocityX: 2.0,
      velocityY: 2.0
    });
    
    // Add corner detection behavior
    this.cornerDetector = new ScreenCornerDetectionEntity({
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      epsilon: 2
    });
    
    // Add hue cycling behavior for rainbow effect
    const hueCycleBehavior = new HueCycleEntity({
      hueIncrement: 0.5
    });
    
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
    // Create sound for corner hits
    this.cornerSound = new AudioEntity('resources/audio/partyHorn.mp3', {
      volume: 0.4,
      autoPlay: false // We'll trigger it manually
    });
    
    this.addChild(this.cornerSound);
  }
  
  /**
   * Handle logo reaching corner
   */
  onUpdate(deltaTime) {
    super.onUpdate(deltaTime);
    
    // Check if corner was reached
    if (this.cornerDetector && this.cornerDetector.cornerReached) {
      this.handleCornerHit();
    }
  }
  
  /**
   * Handle corner hit - play sound and trigger callback
   */
  handleCornerHit() {
    // Play celebration sound
    if (this.cornerSound) {
      this.cornerSound.playAudio();
    }
    
    // Trigger callback if provided (e.g., spawn confetti)
    if (this.onCornerHit) {
      this.onCornerHit();
    }
    
    // Scene finishes when corner is hit
    this.finish();
  }
  
  /**
   * Get current logo position (useful for spawning effects at logo location)
   * @returns {object} Object with x, y coordinates
   */
  getLogoPosition() {
    if (this.logo) {
      return { x: this.logo.x, y: this.logo.y };
    }
    return { x: 0, y: 0 };
  }
}