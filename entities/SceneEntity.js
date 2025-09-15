import Entity from './Entity.js';

/**
 * Base class for scene entities.
 * Provides screen dimensions for child entities that need them.
 */
export default class SceneEntity extends Entity {
  constructor(config = {}, parent = null) {
    super(config, parent);
    
    this.screenWidth = config.screenWidth || 800;
    this.screenHeight = config.screenHeight || 600;
  }
}