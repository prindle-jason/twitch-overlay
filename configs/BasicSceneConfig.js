// configs/BasicSceneConfig.js
// Simple test configuration - display image, play sound, expire after 5 seconds

import ImageEntity from '../entities/ImageEntity.js';
import AudioEntity from '../entities/AudioEntity.js';
import FinishAfterDurationBehavior from '../behaviors/FinishAfterDurationBehavior.js';

export const basicSceneConfig = {
  name: 'basicScene',
  children: [
    // Center image (existing)
    {
      entityClass: ImageEntity,
      name: 'centerImage',
      imageName: 'bobSuccess',
      x: 960,     // Center of 1920x1080
      y: 540,
      anchorX: 0.5,
      anchorY: 0.5,
      scaleX: 0.5,
      scaleY: 0.5,
      enabled: true
    },

    // Top-left corner - anchor (0,0) means x,y represents top-left of image
    {
      entityClass: ImageEntity,
      name: 'topLeftImage',
      imageName: 'greenRupee',
      x: 0,       // Top-left corner of screen
      y: 0,
      anchorX: 0.0,
      anchorY: 0.0,
      scaleX: 0.3,
      scaleY: 0.3,
      enabled: true
    },

    // Top-right corner - anchor (1,0) means x,y represents top-right of image
    {
      entityClass: ImageEntity,
      name: 'topRightImage',
      imageName: 'blueRupee',
      x: 1920,    // Right edge of screen
      y: 0,       // Top edge of screen
      anchorX: 1.0,
      anchorY: 0.0,
      scaleX: 0.3,
      scaleY: 0.3,
      enabled: true
    },

    // Bottom-left corner - anchor (0,1) means x,y represents bottom-left of image
    {
      entityClass: ImageEntity,
      name: 'bottomLeftImage',
      imageName: 'redRupee',
      x: 0,       // Left edge of screen
      y: 1080,    // Bottom edge of screen
      anchorX: 0.0,
      anchorY: 1.0,
      scaleX: 0.3,
      scaleY: 0.3,
      enabled: true
    },

    // Bottom-right corner - anchor (1,1) means x,y represents bottom-right of image
    {
      entityClass: ImageEntity,
      name: 'bottomRightImage',
      imageName: 'dvdLogo',
      x: 1920,    // Right edge of screen
      y: 1080,    // Bottom edge of screen
      anchorX: 1.0,
      anchorY: 1.0,
      scaleX: 0.3,
      scaleY: 0.3,
      enabled: true
    }

    // Success sound
    // {
    //   entityClass: AudioEntity,
    //   name: 'testSound',
    //   audioName: 'bustamove-hooray',
    //   volume: 1.0,
    //   enabled: true
    // },

    // 5 second timer to end the scene
    // {
    //   entityClass: TimedEntity,
    //   name: 'sceneTimer',
    //   duration: 5000,
    //   enabled: true
    // }
  ]
};