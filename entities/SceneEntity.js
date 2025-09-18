import Entity from './Entity.js';

/**
 * Base class for scene entities.
 * Provides screen dimensions for child entities that need them.
 * Scenes are always root-level entities and never have parents.
 */
export default class SceneEntity extends Entity {
  constructor(screenWidth, screenHeight, config = {}) {
    super(config); // No parent - scenes are always root level
    
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }
}