import { Entity } from '../entities/Entity';
import { EntityState } from '../entities/EntityState';
import { RenderableEntity } from '../entities/RenderableEntity';
import { AssetManager } from '../managers/AssetManager';

/**
 * Scene - Base class for all overlay scenes
 * 
 * Manages a collection of entities and provides scene lifecycle.
 * Scenes are the main unit of organization for related visual effects.
 */
export abstract class Scene {
  protected static nextId: number = 1;

  public readonly id: number;
  public readonly name: string;
  protected entities: Entity[] = [];
  protected assetManager: AssetManager;
  
  // Scene state
  protected isInitialized: boolean = false;
  protected isPlaying: boolean = false;
  protected creationTime: number;

  constructor(name: string) {
    this.id = Scene.nextId++;
    this.name = name;
    this.assetManager = AssetManager.getInstance();
    this.creationTime = Date.now();
  }

  // === Scene Lifecycle ===

  /**
   * Initialize the scene (called once after creation)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log(`🎬 Initializing scene: ${this.name}#${this.id}`);
    
    try {
      // Let subclass create its entities
      await this.createEntities();
      
      // Initialize all entities
      for (const entity of this.entities) {
        if (entity.isConstructed()) {
          entity.state = EntityState.INITIALIZED;
          entity.onInitialize();
        }
      }

      this.isInitialized = true;
      console.log(`✅ Scene initialized: ${this.name}#${this.id} (${this.entities.length} entities)`);
    } catch (error) {
      console.error(`❌ Failed to initialize scene ${this.name}#${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Start the scene (begins entity updates)
   */
  start(): void {
    if (!this.isInitialized) {
      console.warn(`Cannot start scene ${this.name}#${this.id} - not initialized`);
      return;
    }

    if (this.isPlaying) return;

    console.log(`▶️ Starting scene: ${this.name}#${this.id}`);
    this.isPlaying = true;

    // Start all entities
    for (const entity of this.entities) {
      if (entity.isInitialized()) {
        entity.state = EntityState.PLAYING;
      }
    }
  }

  /**
   * Update the scene (called every frame)
   */
  update(deltaTime: number): void {
    if (!this.isPlaying) return;

    // Update all entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (!entity) continue; // Safety check
      
      if (entity.isFinished()) {
        // Remove finished entities
        this.removeEntity(entity);
        continue;
      }

      // Update active entities based on their state
      if (entity.isPlaying()) {
        entity.updatePlaying(deltaTime);
      } else if (entity.isPaused()) {
        entity.updatePaused(deltaTime);
      }
    }
  }

  /**
   * Render the scene (called every frame)
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.isInitialized) return;

    // Render all renderable entities
    for (const entity of this.entities) {
      if (entity instanceof RenderableEntity && entity.isEffectivelyVisible()) {
        entity.render(ctx);
      }
    }
  }

  /**
   * Check if scene is finished (all entities finished)
   */
  isFinished(): boolean {
    return this.entities.length === 0 || this.entities.every(entity => entity.isFinished());
  }

  /**
   * Stop the scene (pauses all entities)
   */
  stop(): void {
    if (!this.isPlaying) return;

    console.log(`⏸️ Stopping scene: ${this.name}#${this.id}`);
    this.isPlaying = false;

    // Pause all entities
    for (const entity of this.entities) {
      if (entity.isPlaying()) {
        entity.state = EntityState.PAUSED;
      }
    }
  }

  /**
   * Destroy the scene (cleanup all resources)
   */
  destroy(): void {
    console.log(`🗑️ Destroying scene: ${this.name}#${this.id}`);
    
    this.isPlaying = false;

    // Dispose all entities
    for (const entity of this.entities) {
      entity.dispose();
    }
    
    this.entities.length = 0;
    this.isInitialized = false;
  }

  // === Entity Management ===

  /**
   * Add an entity to the scene
   */
  protected addEntity(entity: Entity): void {
    this.entities.push(entity);

    // If scene is already initialized, initialize the new entity
    if (this.isInitialized && entity.isConstructed()) {
      entity.state = EntityState.INITIALIZED;
      entity.onInitialize();
    }

    // If scene is playing, start the entity
    if (this.isPlaying && entity.isInitialized()) {
      entity.state = EntityState.PLAYING;
    }
  }

  /**
   * Remove an entity from the scene
   */
  protected removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
      entity.dispose();
    }
  }

  /**
   * Get all entities in the scene
   */
  getEntities(): readonly Entity[] {
    return this.entities;
  }

  /**
   * Get entities of a specific type
   */
  getEntitiesOfType<T extends Entity>(type: new (...args: any[]) => T): T[] {
    return this.entities.filter(entity => entity instanceof type) as T[];
  }

  /**
   * Find entity by name
   */
  getEntityByName(name: string): Entity | null {
    return this.entities.find(entity => entity.name === name) || null;
  }

  // === Abstract Methods ===

  /**
   * Called during initialization to create scene entities
   * Override in subclasses to define scene content
   */
  protected abstract createEntities(): Promise<void>;

  // === Scene Info ===

  /**
   * Get scene age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.creationTime;
  }

  /**
   * Get scene statistics
   */
  getStats(): {
    id: number;
    name: string;
    age: number;
    entityCount: number;
    initialized: boolean;
    playing: boolean;
    finished: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      age: this.getAge(),
      entityCount: this.entities.length,
      initialized: this.isInitialized,
      playing: this.isPlaying,
      finished: this.isFinished()
    };
  }

  // === Debug Helpers ===

  toString(): string {
    const state = this.isPlaying ? 'PLAYING' : this.isInitialized ? 'INITIALIZED' : 'CREATED';
    return `Scene(${this.name}#${this.id})[${state}] ${this.entities.length} entities`;
  }

  getDebugInfo(): any {
    return {
      ...this.getStats(),
      entities: this.entities.map(entity => ({
        name: entity.name,
        state: entity.state,
        type: entity.constructor.name
      }))
    };
  }
}