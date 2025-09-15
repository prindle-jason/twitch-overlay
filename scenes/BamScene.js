import SceneEntity from '../entities/SceneEntity.js';

/**
 * BAM  scene - Bub and Bob slide in from sides.
 * Simple effect with characters sliding in and sound.
 */
export default class BamScene extends SceneEntity {
  constructor(config = {}) {
    super(config);
  }

  onPlay() {
    super.onPlay();
    
    // Get the image entities
    const bubImage = this.getChildByName('bub');
    const bobImage = this.getChildByName('bob');
    
    // Get their translate behaviors
    const bubTranslate = bubImage.getChildByName('bubTranslate');
    const bobTranslate = bobImage.getChildByName('bobTranslate');
    
    // Calculate deltas based on scaled dimensions
    bubTranslate.deltaX = bubImage.getScaledWidth();    // Move right by width
    bubTranslate.deltaY = -bubImage.getScaledHeight();  // Move up by height
    bubTranslate.disabled = false;  // Enable the behavior
    
    bobTranslate.deltaX = -bobImage.getScaledWidth();   // Move left by width  
    bobTranslate.deltaY = -bobImage.getScaledHeight();  // Move up by height
    bobTranslate.disabled = false;  // Enable the behavior
  }
}