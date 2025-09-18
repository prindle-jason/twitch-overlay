// behaviors/AngleVariationBehavior.js
import { BaseBehavior } from './BaseBehavior.js';
import { getRandomInRange, getClamp } from '../utils/mathUtils.js';

export class AngleVariationBehavior extends BaseBehavior {
  constructor(config = {}) {
    super(config);
    this.limit = config.limit || 0.1; // Default ±0.1 radians (~6 degrees)
    this.delta = config.delta || 0.01; // How much variation per update (not used in random approach)
    console.log('AngleVariationBehavior created with limit:', this.limit, 'delta:', this.delta);

    // Store base angle and range (set in onPlay)
    //this.baseAngle = 0;
    this.minAngle = 0;
    this.maxAngle = 0;
  }
  
  onPlay(element) {
    // Store the element's starting angle as the base
    //this.baseAngle = element.angle;
    
    // Calculate min/max range around the base angle
    this.minAngle = element.angle - this.limit;
    this.maxAngle = element.angle + this.limit;
  }
  
  update(element, deltaTime) {
    console.log('AngleVariationBehavior update - current angle:', element.angle);
    // Pick a new random angle within the allowed range
    const minDelta = element.angle - this.delta;
    const maxDelta = element.angle + this.delta;
    const randomAngle = getRandomInRange(minDelta, maxDelta);
    console.log('AngleVariationBehavior update - random angle:', randomAngle, 'within', minDelta, maxDelta);

    // Apply it to the element (clamping for safety, though shouldn't be needed)
    const clamp = getClamp(randomAngle, this.minAngle, this.maxAngle);
    console.log('Clamped angle:', clamp, 'Min:', this.minAngle, 'Max:', this.maxAngle);
    element.angle = clamp
  }
}
