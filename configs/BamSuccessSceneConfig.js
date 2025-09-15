// configs/BamSuccessSceneConfig.js
// Configuration for BamSuccessScene - Bub and Bob celebration effect

import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import TranslateEntity from '../behaviors/TranslateEntity.js';
import TimedEntity from '../behaviors/TimedEntity.js';
import AudioStartOnPlayBehavior from '../behaviors/AudioStartOnPlayBehavior.js';

export const bamSuccessSceneConfig = {
  children: [
    // Bub character in bottom-left corner
    {
      entityClass: ImageEntity,
      name: 'bub',
      imageName: 'bubSuccess',
      x: 0,        // Left edge
      y: 1080,     // Bottom edge
      anchorX: 0.0,  // Left anchor
      anchorY: 1.0,  // Bottom anchor
      scaleX: 0.25,
      scaleY: 0.25,
      children: [
        {
          entityClass: TranslateEntity,
          name: 'bubTranslate',
          // deltaX and deltaY will be set by scene based on scaled dimensions
          duration: 2000,
          disabled: true  // Scene will enable after setting deltas
        }
      ]
    },

    // Bob character in bottom-right corner
    {
      entityClass: ImageEntity,
      name: 'bob',
      imageName: 'bobSuccess',
      x: 1920,     // Right edge
      y: 1080,     // Bottom edge
      anchorX: 1.0,  // Right anchor
      anchorY: 1.0,  // Bottom anchor
      scaleX: 0.25,
      scaleY: 0.25,
      children: [
        {
          entityClass: TranslateEntity,
          name: 'bobTranslate',
          // deltaX and deltaY will be set by scene based on scaled dimensions
          duration: 2000,
          disabled: true  // Scene will enable after setting deltas
        }
      ]
    },

    // Success celebration sound with behavior to start on play
    {
      entityClass: AudioEntity,
      name: 'successSound',
      audioName: 'bamHooray',
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
      duration: 4000
    }
  ]
};