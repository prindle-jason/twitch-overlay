import Entity from '../entities/Entity.js';

/**
 * Base class for behavior entities.
 * Behaviors always operate on a parent entity and require one to be provided.
 * This enforces the contract that behaviors modify their parent.
 */
export default class BaseBehavior extends Entity {
  constructor(config = {}, parent) {
    super(config);
    
    // Behaviors MUST have a parent
    if (!parent) {
      throw new Error(`${this.constructor.name}: Behaviors require a parent entity`);
    }
    
    this.parent = parent;
  }
}