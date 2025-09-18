import SceneEntity from '../entities/SceneEntity.js';
import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import TranslateBehavior from '../behaviors/TranslateBehavior.js';
import FinishAfterDurationBehavior from '../behaviors/FinishAfterDurationBehavior.js';

/**
 * BAM scene - Bub and Bob slide in from sides.
 * Uses direct entity creation for clarity and maintainability.
 */
export default class BamScene extends SceneEntity {
  constructor(screenWidth, screenHeight) {
    super(screenWidth, screenHeight);
  }

  /**
   * Create a common BAM scene with specified resources
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {string} bubImageName - Bub character image name
   * @param {string} bobImageName - Bob character image name
   * @param {string} audioName - Audio resource name
   * @param {number} duration - Scene duration in milliseconds
   * @param {Object} options - Optional overrides
   * @returns {BamScene} Configured scene
   */
  static createCommon(screenWidth, screenHeight, bubImageName, bobImageName, audioName, duration, options = {}) {
    const scene = new BamScene(screenWidth, screenHeight);
    const imageScale = 0.25;
    
    // Create Bub character in bottom-left corner
    const bubImage = new ImageEntity({
      name: 'bub',
      imageName: bubImageName,
      x: 0,              // Left edge
      y: screenHeight,   // Bottom edge
      anchorX: 1.0,      // Right anchor
      anchorY: 0.0,      // Top anchor
      scaleX: imageScale,
      scaleY: imageScale
    });
    
    // Add translate behavior to Bub (initially disabled)
    const bubTranslate = new TranslateBehavior({
      name: 'bubTranslate',
      duration: duration,
      deltaX: bubImage.getScaledWidth(),    
      deltaY: -bubImage.getScaledHeight(),  
    }, bubImage);
    
    // Create Bob character in bottom-right corner
    const bobImage = new ImageEntity({
      name: 'bob',
      imageName: bobImageName,
      x: screenWidth,    // Right edge
      y: screenHeight,   // Bottom edge
      anchorX: 0.0,      // Left anchor
      anchorY: 0.0,      // Top anchor
      scaleX: imageScale,
      scaleY: imageScale
    });
    
    // Add translate behavior to Bob (initially disabled)
    const bobTranslate = new TranslateBehavior({
      name: 'bobTranslate',
      duration: duration,
      deltaX: -bobImage.getScaledWidth(),    
      deltaY: -bobImage.getScaledHeight(),  
    }, bobImage);
    
    // Create audio with auto-play behavior
    const audio = AudioEntity.createOnPlayEntity(audioName, { volume: 0.4 });
    
    // Create scene timer
    const timer = new FinishAfterDurationBehavior({
      duration: duration
    }, scene);
    
    // Build the entity hierarchy
    bubImage.addChild(bubTranslate);
    bobImage.addChild(bobTranslate);
    scene.addChild(bubImage);
    scene.addChild(bobImage);
    scene.addChild(audio);
    scene.addChild(timer);
    
    return scene;
  }

  /**
   * Create a BAM success scene
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {Object} options - Optional overrides (duration, etc.)
   * @returns {BamScene} Configured success scene
   */
  static createSuccess(screenWidth, screenHeight, options = {}) {
    const duration = options.duration || 5000;
    return BamScene.createCommon(
      screenWidth, 
      screenHeight, 
      'bubSuccess', 
      'bobSuccess', 
      'bamHooray', 
      duration, 
      options
    );
  }

  /**
   * Create a BAM failure scene
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {Object} options - Optional overrides (duration, etc.)
   * @returns {BamScene} Configured failure scene
   */
  static createFailure(screenWidth, screenHeight, options = {}) {
    const duration = options.duration || 6500;
    return BamScene.createCommon(
      screenWidth, 
      screenHeight, 
      'bubFailure', 
      'bobFailure', 
      'bamUhOh', 
      duration, 
      options
    );
  }
}