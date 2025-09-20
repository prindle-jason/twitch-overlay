import Entity from './Entity.js';

/**
 * PrefabEntity - A template entity that can be cloned to create new instances.
 * 
 * A prefab stores a configuration object and entity class, allowing you to create
 * multiple identical entities with optional parameter overrides.
 * 
 * Usage:
 *   const prefab = new PrefabEntity(ImageEntity, {
 *     imageName: 'popup',
 *     width: 100,
 *     height: 50
 *   });
 *   
 *   const instance1 = prefab.instantiate({ x: 100, y: 200 });
 *   const instance2 = prefab.instantiate({ x: 300, y: 400, opacity: 0.5 });
 */
export default class PrefabEntity extends Entity {
  constructor(config = {}) {
    super(config);
    
    this.entityClass = config.entityClass || null;
    this.templateConfig = config.templateConfig || {};
    
    if (!this.entityClass) {
      console.warn('PrefabEntity created without entityClass');
    }
  }
  
  /**
   * Create a new instance of the prefab entity
   * @param {object} overrides - Configuration overrides to apply to the template
   * @returns {Entity} New entity instance based on the template
   */
  instantiate(overrides = {}) {
    if (!this.entityClass) {
      console.error('Cannot instantiate prefab: no entityClass specified');
      return null;
    }
    
    try {
      // Deep clone the template configuration
      const config = structuredClone(this.templateConfig);
      
      // Apply overrides (shallow merge for top-level properties)
      Object.assign(config, overrides);
      
      // Create new entity instance
      const instance = new this.entityClass(config);
      
      return instance;
    } catch (error) {
      console.error('Error instantiating prefab:', error);
      return null;
    }
  }
  
  /**
   * Create a new instance with deep configuration merging
   * @param {object} overrides - Configuration overrides (supports nested objects)
   * @returns {Entity} New entity instance
   */
  instantiateDeep(overrides = {}) {
    if (!this.entityClass) {
      console.error('Cannot instantiate prefab: no entityClass specified');
      return null;
    }
    
    try {
      // Deep clone the template configuration
      const config = structuredClone(this.templateConfig);
      
      // Deep merge overrides
      this._deepMerge(config, overrides);
      
      // Create new entity instance
      const instance = new this.entityClass(config);
      
      return instance;
    } catch (error) {
      console.error('Error instantiating prefab with deep merge:', error);
      return null;
    }
  }
  
  /**
   * Deep merge source object into target object
   * @param {object} target - Target object to merge into
   * @param {object} source - Source object to merge from
   */
  _deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // If target doesn't have this key or it's not an object, create new object
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          this._deepMerge(target[key], source[key]);
        } else {
          // Direct assignment for primitives, arrays, and null/undefined
          target[key] = source[key];
        }
      }
    }
  }
  
  /**
   * Create multiple instances at once
   * @param {number} count - Number of instances to create
   * @param {function} overrideFunction - Function that returns overrides for each instance
   *                                     Receives (index, count) as parameters
   * @returns {Array<Entity>} Array of entity instances
   */
  instantiateMultiple(count, overrideFunction = null) {
    const instances = [];
    
    for (let i = 0; i < count; i++) {
      let overrides = {};
      if (overrideFunction && typeof overrideFunction === 'function') {
        overrides = overrideFunction(i, count) || {};
      }
      
      const instance = this.instantiate(overrides);
      if (instance) {
        instances.push(instance);
      }
    }
    
    return instances;
  }
  
  /**
   * Get the template configuration (read-only)
   * @returns {object} Deep copy of the template configuration
   */
  getTemplate() {
    return structuredClone(this.templateConfig);
  }
  
  /**
   * Update the template configuration
   * @param {object} newTemplate - New template configuration
   */
  setTemplate(newTemplate) {
    this.templateConfig = structuredClone(newTemplate);
  }
  
  /**
   * Static factory method to create a prefab from an entity class and config
   * @param {Function} entityClass - Entity class constructor
   * @param {object} templateConfig - Template configuration object
   * @param {object} prefabConfig - Additional prefab configuration (name, etc.)
   * @returns {PrefabEntity} New prefab entity
   */
  static create(entityClass, templateConfig, prefabConfig = {}) {
    return new PrefabEntity({
      ...prefabConfig,
      entityClass: entityClass,
      templateConfig: templateConfig
    });
  }
  
  /**
   * Create a prefab from an existing entity instance
   * @param {Entity} entity - Existing entity to use as template
   * @param {object} prefabConfig - Additional prefab configuration
   * @returns {PrefabEntity} New prefab entity
   */
  static fromEntity(entity, prefabConfig = {}) {
    // Extract configuration from entity
    const templateConfig = {
      name: entity.name,
      disabled: entity.disabled
    };
    
    // Add transform properties if it's a TransformEntity
    if (entity.x !== undefined) {
      Object.assign(templateConfig, {
        x: entity.x,
        y: entity.y,
        scaleX: entity.scaleX,
        scaleY: entity.scaleY,
        rotation: entity.rotation,
        opacity: entity.opacity,
        anchorX: entity.anchorX,
        anchorY: entity.anchorY,
        width: entity.width,
        height: entity.height
      });
    }
    
    // Add image properties if it's an ImageEntity
    if (entity.imageName !== undefined) {
      templateConfig.imageName = entity.imageName;
    }
    
    // TODO: Could add support for extracting other entity-specific properties
    
    return new PrefabEntity({
      ...prefabConfig,
      entityClass: entity.constructor,
      templateConfig: templateConfig
    });
  }
}