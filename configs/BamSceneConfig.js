import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import TranslateEntity from '../behaviors/TranslateEntity.js';
import TimedEntity from '../behaviors/TimedEntity.js';
import AudioStartOnPlayBehavior from '../behaviors/AudioStartOnPlayBehavior.js';

const imageScale = 0.25;

/**
 * Factory function to create Bam scene configurations
 * @param {string} type - 'success' or 'failure'
 * @param {Object} options - Optional overrides
 * @returns {Object} Scene configuration object
 */
function createBamSceneConfig(type, options = {}) {
  // Type-specific configurations
  const typeConfigs = {
    success: {
      bubImageName: 'bubSuccess',
      bobImageName: 'bobSuccess',
      audioName: 'bamHooray',
      duration: 5000
    },
    failure: {
      bubImageName: 'bubFailure',
      bobImageName: 'bobFailure',
      audioName: 'bamUhOh',
      duration: 6500
    }
  };

  const config = typeConfigs[type];
  if (!config) {
    throw new Error(`Invalid Bam scene type: ${type}. Must be 'success' or 'failure'.`);
  }

  // Merge with any provided options
  const finalConfig = { ...config, ...options };

  return {
  children: [
    // Bub character in bottom-left corner
    {
      entityClass: ImageEntity,
      name: 'bub',
      imageName: finalConfig.bubImageName,
      x: 0,        // Left edge
      y: 1080,     // Bottom edge
      anchorX: 1.0,  // Right anchor
      anchorY: 0.0,  // Top anchor
      scaleX: imageScale,
      scaleY: imageScale,
      children: [
        {
          entityClass: TranslateEntity,
          name: 'bubTranslate',
          // deltaX and deltaY will be set by scene based on scaled dimensions
          duration: finalConfig.duration,
          disabled: true  // Scene will enable after setting deltas
        }
      ]
    },

    // Bob character in bottom-right corner
    {
      entityClass: ImageEntity,
      name: 'bob',
      imageName: finalConfig.bobImageName,
      x: 1920,     // Right edge
      y: 1080,     // Bottom edge
      anchorX: 0.0,  // Left anchor
      anchorY: 0.0,  // Top anchor
      scaleX: imageScale,
      scaleY: imageScale,
      children: [
        {
          entityClass: TranslateEntity,
          name: 'bobTranslate',
          // deltaX and deltaY will be set by scene based on scaled dimensions
          duration: finalConfig.duration,
          disabled: true  // Scene will enable after setting deltas
        }
      ]
    },

    // Audio with behavior to start on play
    {
      entityClass: AudioEntity,
      name: `${type}Sound`,
      audioName: finalConfig.audioName,
      volume: 0.4,
      children: [
        {
          entityClass: AudioStartOnPlayBehavior,
          name: 'audioStarter',
        }
      ]
    },
    {
      entityClass: TimedEntity,
      name: 'sceneTimer',
      duration: finalConfig.duration
    }
  ]
  };
}

// Export the success configuration (maintaining backward compatibility)
export const bamSuccessSceneConfig = createBamSceneConfig('success');
export const bamFailureSceneConfig = createBamSceneConfig('failure');