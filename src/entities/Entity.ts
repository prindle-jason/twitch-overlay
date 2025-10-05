import { EntityState } from '@/entities/EntityState';
import { Behavior } from '@/behaviors/Behavior';

/**
 * Base class for all entities in the system.
 * Provides state tracking, progression, and parent-child hierarchy.
 * 
 * Key principles:
 * - Clean constructors with explicit parameters (no config objects)
 * - Manager-driven updates (managers handle lifecycle, entities provide state)
 * - Progression system (0-1) only relevant during PLAYING/PAUSED states
 * - Separate children (entities) and behaviors lists
 * - Cloneable without parent reference issues
 */
export abstract class Entity {
  // State management
  private _state: EntityState = EntityState.CONSTRUCTED;
  private _disabled: boolean = false;

  // Progression tracking (0-1, only relevant during PLAYING/PAUSED)
  // NOTE: Currently 0-1 range, but may be enhanced in future for more complex progression types
  private _progress: number = 0;

  // Hierarchy - separate children and behaviors
  private _children: Entity[] = [];
  private _behaviors: Behavior[] = [];

  /**
   * Create a new entity with explicit parameters
   * Constructor should do minimal work - heavy lifting goes in onInitialize()
   * 
   * @param name - Human-readable name for debugging
   * @param id - Unique identifier (auto-generated if not provided)
   */
  constructor(
    public readonly name: string, 
    public readonly id: string = `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  ) {
    // Minimal constructor following clean architecture principles
  }

  // === State Management ===

  /**
   * Get current entity state
   */
  get state(): EntityState {
    return this._state;
  }

  /**
   * Set entity state - can be called by managers, behaviors, or other systems
   */
  setState(newState: EntityState): void {
    this._state = newState;
  }

  /**
   * Check if entity is in CONSTRUCTED state
   */
  isConstructed(): boolean {
    return this._state === EntityState.CONSTRUCTED;
  }

  /**
   * Check if entity is in INITIALIZED state (ready to start)
   */
  isInitialized(): boolean {
    return this._state === EntityState.INITIALIZED;
  }

  /**
   * Check if entity is in PLAYING state
   */
  isPlaying(): boolean {
    return this._state === EntityState.PLAYING;
  }

  /**
   * Check if entity is in PAUSED state
   */
  isPaused(): boolean {
    return this._state === EntityState.PAUSED;
  }

  /**
   * Check if entity is in FINISHED state
   */
  isFinished(): boolean {
    return this._state === EntityState.FINISHED;
  }

  /**
   * Check if entity is disabled
   * Disabled entities aren't updated at all, won't change state, won't progress
   */
  get disabled(): boolean {
    return this._disabled;
  }

  /**
   * Enable the entity (allows updates and state changes)
   */
  enable(): void {
    this._disabled = false;
  }

  /**
   * Disable the entity (prevents all updates, state changes, and progression)
   */
  disable(): void {
    this._disabled = true;
  }

  // === Progression System ===

  /**
   * Get current progression (0-1)
   * Only relevant during PLAYING/PAUSED states
   * NOTE: May be enhanced in future for more complex progression tracking
   */
  getProgress(): number {
    return this._progress;
  }

  /**
   * Set progression manually (0-1)
   * Only relevant during PLAYING/PAUSED states
   * NOTE: May be enhanced in future for more complex progression types
   * @param value - Progress value between 0 and 1
   */
  setProgress(value: number): void {
    this._progress = Math.max(0, Math.min(1, value));
  }

  // === Lifecycle Methods ===

  /**
   * Called when entity is initialized (CONSTRUCTED → INITIALIZED)
   * Override in subclasses for initialization logic
   */
  onInitialize(): void {
    // Override in subclasses
  }

  /**
   * Called when entity starts playing for the first time (INITIALIZED → PLAYING)
   * Override in subclasses for first-time setup logic
   */
  onPlay(): void {
    // Override in subclasses
  }

  /**
   * Update the entity (called every frame while PLAYING)
   * Override in subclasses for frame-by-frame logic
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  updatePlaying(_deltaTime: number): void {
    // Override in subclasses
  }

  /**
   * Called when entity is paused (PLAYING → PAUSED)
   * Override in subclasses for pause logic
   */
  onPause(): void {
    // Override in subclasses
  }

  /**
   * Update the entity (called every frame while PAUSED, if needed)
   * Override in subclasses for paused-state logic
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  updatePaused(_deltaTime: number): void {
    // Override in subclasses
  }

  /**
   * Called when entity resumes from pause (PAUSED → PLAYING)
   * Override in subclasses for resume logic
   */
  onUnpause(): void {
    // Override in subclasses
  }

  /**
   * Called when entity finishes (transitions to FINISHED state)
   * Override in subclasses for cleanup logic
   */
  onFinish(): void {
    // Override in subclasses
  }

  /**
   * Dispose of the entity and clean up resources
   * Called when entity is being removed from the system
   * Override in subclasses for resource cleanup
   */
  dispose(): void {
    // Clean up children
    this._children.forEach(child => child.dispose());
    this._children.length = 0;
    
    // Clean up behaviors (when implemented)
    this._behaviors.length = 0;
    
    // Override in subclasses for additional cleanup
  }

  /**
   * Reset entity to initial state (placeholder for future use)
   * Currently unused but planned for future functionality
   */
  reset(): void {
    // Empty placeholder - will be implemented when needed
  }

  // === Child Management ===

  /**
   * Get all children entities
   */
  get children(): readonly Entity[] {
    return this._children;
  }

  /**
   * Add a child entity
   * @param child - Entity to add as child
   */
  addChild(child: Entity): void {
    if (!this._children.includes(child)) {
      this._children.push(child);
    }
  }

  /**
   * Remove a child entity
   * @param child - Entity to remove
   */
  removeChild(child: Entity): void {
    const index = this._children.indexOf(child);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  /**
   * Get all children of a specific type
   * @param type - Constructor function to filter by
   */
  getChildrenOfType<T extends Entity>(type: new (...args: any[]) => T): T[] {
    return this._children.filter(child => child instanceof type) as T[];
  }

  /**
   * Find first child of a specific type
   * @param type - Constructor function to find
   */
  getChildOfType<T extends Entity>(type: new (...args: any[]) => T): T | null {
    return this._children.find(child => child instanceof type) as T || null;
  }

  /**
   * Get child by name
   * @param name - Name to search for
   */
  getChildByName(name: string): Entity | null {
    return this._children.find(child => child.name === name) || null;
  }

  // === Behavior Management (Placeholder) ===
  
  /**
   * Get attached behaviors
   * TODO: Implement when BehaviorManager is created
   */
  get behaviors(): readonly Behavior[] {
    return this._behaviors;
  }

  // === Cloning Support ===

  /**
   * Create a deep copy of this entity without parent references
   * Override in subclasses to handle specific properties
   * @returns A new entity instance that's a copy of this one
   */
  clone(): Entity {
    // Create new instance with same name (new ID will be auto-generated)
    const cloned = new (this.constructor as new (name: string) => Entity)(this.name);
    
    // Copy progression state
    cloned._progress = this._progress;
    cloned._disabled = this._disabled;
    // Note: state is not copied - clones start in CONSTRUCTED state
    
    // Clone children (recursive)
    this._children.forEach(child => {
      cloned.addChild(child.clone());
    });
    
    // TODO: Clone behaviors when BehaviorManager is implemented
    // Behaviors will need special cloning logic to avoid parent reference issues
    
    // Override in subclasses to copy additional properties
    return cloned;
  }
}