// configs/ChildTestConfig.js
// Test configuration for parent-child entity hierarchy and transform inheritance

import ImageEntity from '../entities/ImageEntity.js';

export const childTestConfig = {
  name: 'childTestScene',
  children: [
    // Green rupee (parent) - positioned at left edge, center vertically
    {
      entityClass: ImageEntity,
      name: 'greenRupee',
      imageName: 'greenRupee',
      x: 0,       // Left edge of screen
      y: 540,     // Center vertically (1080/2)
      anchorX: 0.0,  // Left anchor
      anchorY: 0.5,  // Center anchor
      scaleX: 0.4,
      scaleY: 0.4,
      enabled: true,
      children: [
        // Blue rupee (child of green) - offset +300 x, +50 y from parent
        {
          entityClass: ImageEntity,
          name: 'blueRupee',
          imageName: 'blueRupee',
          x: 200,     // +300 from parent position
          y: 200,      // +50 from parent position
          anchorX: 0.0,
          anchorY: 0.5,
          scaleX: 1,
          scaleY: 1,
          enabled: true,
          children: [
            // Red rupee (child of blue) - offset +300 x, +50 y from blue
            {
              entityClass: ImageEntity,
              name: 'redRupee',
              imageName: 'redRupee',
              x: 200,     // +300 from blue position (600 total from green)
              y: 200,      // +50 from blue position (100 total from green)
              anchorX: 0.0,
              anchorY: 0.5,
              scaleX: 1,
              scaleY: 1,
              enabled: true
            }
          ]
        }
      ]
    }
  ]
};