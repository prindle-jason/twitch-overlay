import { Entity } from '@/entities/Entity';
import { EntityState } from '@/entities/EntityState';

/**
 * UpdateSystem - Handles entity lifecycle and state transitions
 * 
 * Minimal MVP implementation focusing on core state machine logic.
 * Processes entity state transitions and calls appropriate lifecycle methods.
 */
export class UpdateSystem {
  /**
   * Process all entities for the current frame
   * @param entities - Array of entities to update
   * @param deltaTime - Time elapsed since last update in milliseconds
   */
  process(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      if (!entity.isDisabled()) {
        this.updateEntity(entity, deltaTime);
      }
    });
  }

  /**
   * Update a single entity based on its current state
   */
  private updateEntity(entity: Entity, deltaTime: number): void {
    switch (entity.state) {
      case EntityState.CONSTRUCTED:
        entity.onInitialize();
        entity.state = EntityState.INITIALIZED;
        break;
        
      case EntityState.INITIALIZED:
        entity.onPlay();
        entity.state = EntityState.PLAYING;
        break;
        
      case EntityState.PLAYING:
        entity.updatePlaying(deltaTime);
        break;
        
      case EntityState.PAUSED:
        entity.updatePaused(deltaTime);
        break;
        
      case EntityState.FINISHED:
        entity.onFinish();
        break;
    }
  }

  /**
   * Pause all entities that are currently playing
   */
  pauseEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      if (entity.state === EntityState.PLAYING) {
        entity.state = EntityState.PAUSED;
        entity.onPause();
      }
    });
  }

  /**
   * Resume all entities that are currently paused
   */
  resumeEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      if (entity.state === EntityState.PAUSED) {
        entity.state = EntityState.PLAYING;
        entity.onUnpause();
      }
    });
  }

  /**
   * Destroy all entities by setting them to finished state
   */
  destroyEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      entity.state = EntityState.FINISHED;
      entity.onFinish();
      entity.dispose();
    });
  }

  /**
   * Remove finished entities from the array and return the remaining entities
   */
  cleanupFinishedEntities(entities: Entity[]): Entity[] {
    return entities.filter(entity => {
      if (entity.state === EntityState.FINISHED) {
        entity.dispose();
        return false;
      }
      return true;
    });
  }
}