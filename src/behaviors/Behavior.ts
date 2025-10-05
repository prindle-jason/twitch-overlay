/**
 * Base class for all behaviors.
 * Behaviors are attached to entities to provide reusable functionality.
 * 
 * This is a placeholder implementation - will be expanded when BehaviorManager is implemented.
 */
export abstract class Behavior {
  /**
   * Create a new behavior
   * @param name - Human-readable name for debugging
   */
  constructor(public readonly name: string) {
    // Minimal constructor following clean architecture principles
  }
}