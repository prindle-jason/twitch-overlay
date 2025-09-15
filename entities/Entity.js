import { EntityState } from './EntityState.js';

/**
 * Base class for all entities in the system.
 * Provides state machine lifecycle, parent-child hierarchy, and timing.
 * Everything is an Entity - effects, elements, and behaviors are all entities.
 */
export default class Entity {
  constructor(config = {}, parent = null) {
    this.state = EntityState.READY;
    this.children = [];
    
    // Identity field
    this.name = config.name || null;
    
    // Enable/disable control
    this.disabled = config.disabled !== undefined ? config.disabled : false;
    
    // Create children from config if specified
    if (config.children && Array.isArray(config.children)) {
      config.children.forEach(childConfig => {
        this.createChildFromConfig(childConfig);
      });
    }
  }
  
  /**
   * State machine-driven update loop
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    switch (this.state) {
      case EntityState.READY:
        this.state = EntityState.PLAYING;
        this.onPlay();
        break;
        
      case EntityState.PLAYING:
        this.elapsed += deltaTime;
        this.onUpdate(deltaTime);
        
        if (this.shouldFinish()) {
          this.state = EntityState.FINISHED;
          this.onFinish();
        }
        break;
        
      case EntityState.PAUSED:
        // Do nothing - stay paused
        break;
        
      case EntityState.FINISHED:
        // Done, parent will remove
        break;
    }
    
    this.updateChildren(deltaTime);
  }
  
  /**
   * Update all children and automatically remove finished ones
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  updateChildren(deltaTime) {
    this.children = this.children.filter(child => {
      // Only update enabled children
      if (!child.disabled) {
        child.update(deltaTime);
      }
      return child.state !== EntityState.FINISHED;
    });
  }
  
  /**
   * Base draw method - override in subclasses that need rendering
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    //console.log(`Entity: ${this.name} draw`);
    // Base implementation draws children
    this.children.forEach(child => {
      if (child.draw && !child.disabled) {
        child.draw(ctx);
      }
    });
  }
  
  // === Lifecycle hooks (override in subclasses) ===
  
  /**
   * Create a child entity from configuration
   * @param {object} childConfig - Child entity configuration
   */
  createChildFromConfig(childConfig) {
    //console.log(`Creating child entity from config:`, childConfig);
    let child = null;
    
    if (childConfig.entityClass) {
      child = new childConfig.entityClass(childConfig, this);
    } else {
      console.warn(`No entityClass specified in child config:`, childConfig);
      return;
    }
    
    if (child) {
      this.addChild(child);
    }
  }
  
  /**
   * Called when entity starts playing (transitions from READY to PLAYING)
   */
  onPlay() {
    // Override in subclasses
  }
  
  /**
   * Called every frame while in PLAYING state
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  onUpdate(deltaTime) {
    // Override in subclasses
  }
  
  /**
   * Called when entity finishes (transitions to FINISHED state)
   */
  onFinish() {
    // Override in subclasses
  }
  
  /**
   * Override to define natural finish conditions
   * @returns {boolean} True if entity should finish naturally
   */
  shouldFinish() {
    return false;
  }
  
  // === Public control methods ===
  
  /**
   * Pause the entity (stops updates but maintains state)
   */
  pause() {
    if (this.state === EntityState.PLAYING) {
      this.state = EntityState.PAUSED;
    }
  }
  
  /**
   * Resume the entity from paused state
   */
  resume() {
    if (this.state === EntityState.PAUSED) {
      this.state = EntityState.PLAYING;
    }
  }
  
  /**
   * Finish the entity immediately (triggers onComplete and moves to FINISHED)
   */
  finish() {
    if (this.state !== EntityState.FINISHED) {
      this.state = EntityState.FINISHED;
      this.onFinish();
    }
  }
  
  /**
   * Enable the entity (allows update and draw operations)
   */
  enable() {
    this.disabled = false;
  }
  
  /**
   * Disable the entity (prevents all update and draw operations)
   */
  disable() {
    this.disabled = true;
  }
  
  // === Child management ===
  
  /**
   * Add a child entity
   * @param {Entity} child - Child entity to add
   */
  addChild(child) {
    this.children.push(child);
  }
  
  /**
   * Remove a child entity
   * @param {Entity} child - Child entity to remove
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }
  
  /**
   * Get all children of a specific type
   * @param {Function} type - Constructor function to filter by
   * @returns {Array} Array of children matching the type
   */
  getChildrenOfType(type) {
    return this.children.filter(child => child instanceof type);
  }
  
  /**
   * Find first child of a specific type
   * @param {Function} type - Constructor function to find
   * @returns {Entity|null} First child matching the type, or null
   */
  getChildOfType(type) {
    return this.children.find(child => child instanceof type) || null;
  }
  
  /**
   * Get child by name
   * @param {string} name - Name to search for
   * @returns {Entity|null} Child with matching name, or null
   */
  getChildByName(name) {
    return this.children.find(child => child.name === name) || null;
  }
}