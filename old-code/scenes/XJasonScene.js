import SceneEntity from '../entities/SceneEntity.js';
import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import FinishAfterDurationBehavior from '../behaviors/FinishAfterDurationBehavior.js';
import { getSoundDuration } from '../core/mediaLoader.js';
import { IntervalRangeTimer } from '../utils/IntervalRangeTimer.js';
import JitterBehavior from '../behaviors/JitterBehavior.js';
import BlurBehavior from '../behaviors/BlurBehavior.js';
import OpacityBehavior from '../behaviors/OpacityBehavior.js';

/**
 * XJason scene - Background audio with dynamically spawned popup images.
 * Demonstrates dynamic entity creation during scene runtime.
 */
export default class XJasonScene extends SceneEntity {
  constructor(screenWidth, screenHeight, options = {}) {
    super(screenWidth, screenHeight, options);
    
    // Popup configuration constants
    this.POPUP_MIN_INTERVAL = 500;
    this.POPUP_MAX_INTERVAL = 900;
    this.POPUP_MIN_DURATION = 1200;
    this.POPUP_MAX_DURATION = 1600;
    this.POPUP_WIDTH = 560;
    this.POPUP_HEIGHT = 120;

    this.SCENE_DURATION = 70000; // Default scene duration in ms
    
    // Track popups for cleanup
    this.activePopups = [];
    
    // Initialize the popup spawner
    this.popupSpawner = new IntervalRangeTimer(
      this.POPUP_MIN_INTERVAL,
      this.POPUP_MAX_INTERVAL,
      () => this.trySpawnPopup()
    );
    
    //this.elapsed = 0;
    //this.duration = 0; // Will be set in create()
  }

  /**
   * Create an XJason scene
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {Object} options - Optional overrides
   * @returns {XJasonScene} Configured scene
   */
  static create(screenWidth, screenHeight, options = {}) {
    const scene = new XJasonScene(screenWidth, screenHeight, options);
    
    // Get audio duration to determine scene length
    //const audioDuration = getSoundDuration('heavyRainJason');
    //scene.duration = audioDuration;
    
    // Create background audio with auto-play
    const audio = AudioEntity.createOnPlayEntity('heavyRainJason');
    
    // Create scene timer
    const timer = new FinishAfterDurationBehavior({
      name: 'SceneTimer',
      duration: scene.SCENE_DURATION
    }, scene);
    
    // Build the entity hierarchy
    scene.addChild(audio);
    scene.addChild(timer);
    
    return scene;
  }

  /**
   * Get a random duration for a popup
   * @returns {number} Random duration between min and max
   */
  getRandomDuration() {
    return this.POPUP_MIN_DURATION + Math.random() * (this.POPUP_MAX_DURATION - this.POPUP_MIN_DURATION);
  }

  /**
   * Try to spawn a popup if there's enough time remaining
   */
  trySpawnPopup() {
    // Check if there's enough time left for a new popup
    const timeRemaining = this.getChildByName('SceneTimer').getTimeRemaining();
    if (timeRemaining >= this.POPUP_MAX_DURATION) {
      this.spawnPopup();
    }
  }

  /**
   * Spawn a new popup at a random position
   */
  spawnPopup() {
    const popupDuration = this.getRandomDuration();

    // Create popup image at random position
    const popup = new ImageEntity({
      imageName: 'xJason',
      width: this.POPUP_WIDTH,
      height: this.POPUP_HEIGHT,
      x: Math.random() * (this.screenWidth - this.POPUP_WIDTH),
      y: Math.random() * (this.screenHeight - this.POPUP_HEIGHT),
      anchorX: 0.0,
      anchorY: 0.0,
      opacity: 0.0
    });

    const jitterBehavior = new JitterBehavior({ jitterAmount: 6 }, popup);
    popup.addChild(jitterBehavior);

    const blurBehavior = new BlurBehavior({ duration: popupDuration, maxBlur: 16 }, popup);
    popup.addChild(blurBehavior);

    const opacityBehavior = new OpacityBehavior({ duration: popupDuration }, popup);
    popup.addChild(opacityBehavior);

    const timer = new FinishAfterDurationBehavior({
      duration: popupDuration
    }, popup);
    popup.addChild(timer);
    
    // Add to scene and track it
    this.addChild(popup);
    this.activePopups.push(popup);
    
    //console.log(`Spawned popup at (${popup.x}, ${popup.y}) for ${popup.duration}ms`);
  }

  /**
   * Update scene - handle spawning and popup cleanup
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    //console.log(`Scene update: deltaTime=${deltaTime}`);
    //Wthis.elapsed += deltaTime;
    
    // Update popup spawner
    this.popupSpawner.update(deltaTime);
  }
}