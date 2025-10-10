import { EntityState } from '@/entities/EntityState';
import { Behavior } from '@/behaviors/Behavior';

/**
 * Optional configuration for Entity construction
 */
export interface EntityConfig {
  /** Maximum progression value (default: 1) */
  maxProgression?: number;
  /** Whether entity starts disabled (default: false) */
  disabled?: boolean;
}

/**
 * Base class for all entities in the system.
 * Provides state tracking, progression, and parent-child hierarchy.
 * 
 * Key principles:
 * - Clean constructors with explicit parameters (no config objects for required params)
 * - Manager-driven updates (managers handle lifecycle, entities provide state)
 * - Flexible progression system (0 to maxProgression, default 0-1)
 * - Separate children (entities) and behaviors lists
 * - Cloneable without parent reference issues
 * 
 * Examples of maxProgression usage:
 * - 1 (default): Traditional percentage progression (0.0 to 1.0)
 * - 3: DVD entity that bounces 3 times (progress: 0, 1, 2, 3)
 * - 100: Health points or score counter (0 to 100)
 * - 5000: Timer in milliseconds (0 to 5000ms)
 * - 360: Rotation in degrees (0° to 360°)
 */
export abstract class Entity {
  private _id: string;
  // State management
  private _state: EntityState = EntityState.CONSTRUCTED;
  private _disabled: boolean = false;

  // Progression tracking (0 to maxProgression, only relevant during PLAYING/PAUSED)
  // NOTE: Currently 0-1 range by default, but can be customized for different progression types
  private _progress: number = 0;
  private _maxProgression: number = 1;

  // Hierarchy - separate children and behaviors
  private _children: Entity[] = [];
  private _behaviors: Behavior[] = [];

  /**
   * Create a new entity with explicit parameters
   * Constructor should do minimal work - heavy lifting goes in onInitialize()
   * ID is auto-generated for uniqueness
   * 
   * @param name - Human-readable name for debugging
   * @param config - Optional configuration for progression and state
   */
  constructor(
    public readonly name: string, 
    config: EntityConfig = {}
  ) {
    this._id = `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    
    // Apply configuration
    if (config.maxProgression !== undefined) {
      this._maxProgression = Math.max(0, config.maxProgression);
    }
    if (config.disabled) {
      this._disabled = true;
    }
  }

  // === State Management ===

  /**
   * Get unique entity identifier
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get current entity state
   */
  get state(): EntityState {
    return this._state;
  }

  /**
   * Set entity state - can be called by managers, behaviors, or other systems
   */
  set state(newState: EntityState) {
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
  isDisabled(): boolean {
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
   * Get current progression (0 to maxProgression)
   * Only relevant during PLAYING/PAUSED states
   */
  getProgress(): number {
    return this._progress;
  }

  /**
   * Set progression manually (0 to maxProgression)
   * Only relevant during PLAYING/PAUSED states
   * @param value - Progress value between 0 and maxProgression
   */
  setProgress(value: number): void {
    this._progress = Math.max(0, Math.min(this._maxProgression, value));
  }

  /**
   * Get maximum progression value
   * Default is 1 (traditional 0-1 range), but can be customized
   */
  getMaxProgression(): number {
    return this._maxProgression;
  }

  /**
   * Set maximum progression value
   * Examples:
   * - 1 (default): Traditional 0-1 percentage progression
   * - 3: DVD bounces 3 times (progress: 0, 1, 2, 3)
   * - 100: Health points (progress: 0-100)
   * - 5000: Duration in milliseconds
   * - 360: Rotation degrees (0° to 360°)
   * 
   * Usage examples:
   * ```typescript
   * // Traditional percentage (default)
   * entity.setMaxProgression(1);
   * entity.setProgress(0.5); // 50% complete
   * 
   * // DVD bounces
   * dvdEntity.setMaxProgression(3);
   * dvdEntity.incrementProgress(1); // First bounce (progress = 1)
   * dvdEntity.incrementProgress(1); // Second bounce (progress = 2)
   * dvdEntity.incrementProgress(1); // Third bounce (progress = 3, complete!)
   * 
   * // Timer countdown
   * timerEntity.setMaxProgression(5000); // 5 seconds
   * // Each frame: timerEntity.incrementProgress(deltaTime)
   * ```
   */
  setMaxProgression(maxProgression: number): void {
    this._maxProgression = Math.max(0, maxProgression);
    // Clamp current progress to new max
    this._progress = Math.min(this._progress, this._maxProgression);
  }

  /**
   * Get progression as a percentage (0-1) regardless of maxProgression
   * Useful for animations and UI that expect 0-1 range
   */
  getProgressPercentage(): number {
    if (this._maxProgression === 0) return 1; // Avoid division by zero
    return this._progress / this._maxProgression;
  }

  /**
   * Check if progression has reached the maximum (entity is ready to finish)
   */
  isProgressionComplete(): boolean {
    return this._progress >= this._maxProgression;
  }

  /**
   * Increment progress by a given amount
   * @param increment - Amount to add to current progress
   * @returns true if progression is now complete, false otherwise
   */
  incrementProgress(increment: number): boolean {
    this.setProgress(this._progress + increment);
    return this.isProgressionComplete();
  }

  /**
   * Set progress as a percentage (0-1) of maxProgression
   * @param percentage - Value between 0 and 1
   */
  setProgressPercentage(percentage: number): void {
    const clampedPercentage = Math.max(0, Math.min(1, percentage));
    this._progress = clampedPercentage * this._maxProgression;
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
   * Must be implemented by subclasses to handle their specific properties
   * @returns A new entity instance that's a copy of this one
   */
  abstract clone(): Entity;

  /**
   * Helper method for subclasses to copy base Entity properties
   * Call this from your clone() implementation after creating the new instance
   */
  protected copyBasicPropertiesTo(target: Entity): void {
    // Copy progression state
    target._progress = this._progress;
    target._maxProgression = this._maxProgression;
    target._disabled = this._disabled;
    // Note: state is not copied - clones start in CONSTRUCTED state
    
    // Clone children (recursive)
    this._children.forEach(child => {
      target.addChild(child.clone());
    });
    
    // TODO: Clone behaviors when BehaviorManager is implemented
    // Behaviors will need special cloning logic to avoid parent reference issues
  }
}