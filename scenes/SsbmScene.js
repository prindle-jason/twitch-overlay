import SceneEntity from '../entities/SceneEntity.js';
import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import OpacityBehavior from '../behaviors/OpacityBehavior.js';
import FinishAfterDurationBehavior from '../behaviors/FinishAfterDurationBehavior.js';

/**
 * SSBM scene - Simple centered image with fade in/out and audio.
 * Uses direct entity creation for clarity and maintainability.
 */
export default class SsbmScene extends SceneEntity {
  constructor(screenWidth, screenHeight) {
    super(screenWidth, screenHeight);
  }

  /**
   * Create a common SSBM scene with specified resources
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {string} imageName - Image resource name to use
   * @param {string} audioName - Audio resource name to use
   * @param {number} duration - Scene duration in milliseconds
   * @param {Object} options - Optional overrides
   * @returns {SsbmScene} Configured scene
   */
  static createCommon(screenWidth, screenHeight, imageName, audioName, duration, options = {}) {
    const scene = new SsbmScene(screenWidth, screenHeight);
    
    // Create centered image with opacity animation
    const image = new ImageEntity({
      imageName: imageName,
      x: screenWidth / 2,
      y: screenHeight / 2,
      anchorX: 0.5,
      anchorY: 0.5,
      opacity: 0
    });
    
    // Add opacity fade behavior to image
    const opacityBehavior = new OpacityBehavior({
      duration: duration,
      easeTime: 0.25
    }, image);
    
    // Create audio with auto-play behavior
    const audio = AudioEntity.createOnPlayEntity(audioName);
    
    // Create scene timer
    const timer = new FinishAfterDurationBehavior({
      duration: duration
    }, scene);
    
    // Build the entity hierarchy
    image.addChild(opacityBehavior);
    scene.addChild(image);
    scene.addChild(audio);
    scene.addChild(timer);
    
    return scene;
  }

  /**
   * Create an SSBM success scene
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {Object} options - Optional overrides (duration, etc.)
   * @returns {SsbmScene} Configured success scene
   */
  static createSuccess(screenWidth, screenHeight, options = {}) {
    const duration = options.duration || 3000;
    return SsbmScene.createCommon(screenWidth, screenHeight, 'ssbmSuccess', 'ssbmSuccess', duration, options);
  }

  /**
   * Create an SSBM failure scene
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {Object} options - Optional overrides (duration, etc.)
   * @returns {SsbmScene} Configured failure scene
   */
  static createFailure(screenWidth, screenHeight, options = {}) {
    const duration = options.duration || 3500;
    return SsbmScene.createCommon(screenWidth, screenHeight, 'ssbmFailure', 'ssbmFailure', duration, options);
  }
}