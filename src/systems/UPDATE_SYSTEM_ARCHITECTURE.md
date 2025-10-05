# UpdateSystem Architecture

## Overview
UpdateSystem manages entity lifecycle, state transitions, and behavior processing. It is the core system that drives entity logic and coordinates with other systems.

## Responsibilities
- **Entity State Management**: Handle transitions between CONSTRUCTED, INITIALIZED, PLAYING, PAUSED, FINISHED
- **Lifecycle Method Calls**: Invoke appropriate entity lifecycle methods
- **Behavior Processing**: Update attached behaviors on entities
- **Scene Control**: Provide pause, resume, and destroy operations for scenes
- **Entity Cleanup**: Properly dispose of finished entities

## Core Implementation

### Main Processing Method
```typescript
class UpdateSystem {
  process(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      this.updateEntity(entity, deltaTime);
    });
    
    // Remove finished entities
    this.cleanupFinishedEntities(entities);
  }
  
  private updateEntity(entity: Entity, deltaTime: number): void {
    switch (entity.state) {
      case EntityState.CONSTRUCTED:
        entity.onInitialize();
        entity.setState(EntityState.INITIALIZED);
        break;
        
      case EntityState.INITIALIZED:
        entity.onPlay();
        entity.setState(EntityState.PLAYING);
        break;
        
      case EntityState.PLAYING:
        entity.updatePlaying(deltaTime);
        this.updateBehaviors(entity, deltaTime);
        break;
        
      case EntityState.PAUSED:
        entity.updatePaused(deltaTime);
        // Behaviors typically don't update when paused
        break;
        
      case EntityState.FINISHED:
        entity.onFinish();
        // Entity will be removed in cleanup phase
        break;
    }
  }
}
```

### State Transition Management
```typescript
class UpdateSystem {
  // Validate state transitions
  private canTransitionTo(entity: Entity, newState: EntityState): boolean {
    const validTransitions = {
      [EntityState.CONSTRUCTED]: [EntityState.INITIALIZED],
      [EntityState.INITIALIZED]: [EntityState.PLAYING, EntityState.FINISHED],
      [EntityState.PLAYING]: [EntityState.PAUSED, EntityState.FINISHED],
      [EntityState.PAUSED]: [EntityState.PLAYING, EntityState.FINISHED],
      [EntityState.FINISHED]: [] // No transitions from finished
    };
    
    return validTransitions[entity.state]?.includes(newState) || false;
  }
  
  // Safe state transition
  transitionEntityState(entity: Entity, newState: EntityState): boolean {
    if (this.canTransitionTo(entity, newState)) {
      entity.setState(newState);
      return true;
    }
    
    console.warn(`Invalid state transition from ${entity.state} to ${newState}`);
    return false;
  }
}
```

### Behavior Processing
```typescript
class UpdateSystem {
  private updateBehaviors(entity: Entity, deltaTime: number): void {
    entity.behaviors.forEach(behavior => {
      if (behavior.enabled && behavior.canUpdate(entity)) {
        behavior.update(entity, deltaTime);
        
        // Check if behavior completed
        if (behavior.isFinished()) {
          entity.removeBehavior(behavior);
        }
      }
    });
  }
}
```

## Scene Control Methods

### Pause Operations
```typescript
class UpdateSystem {
  pauseEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      if (entity.state === EntityState.PLAYING) {
        this.transitionEntityState(entity, EntityState.PAUSED);
      }
    });
  }
  
  resumeEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      if (entity.state === EntityState.PAUSED) {
        this.transitionEntityState(entity, EntityState.PLAYING);
      }
    });
  }
}
```

### Entity Disposal
```typescript
class UpdateSystem {
  destroyEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      // Transition to finished state
      entity.setState(EntityState.FINISHED);
      
      // Trigger cleanup
      entity.onFinish();
      entity.dispose();
    });
  }
  
  private cleanupFinishedEntities(entities: Entity[]): Entity[] {
    const activeEntities: Entity[] = [];
    
    entities.forEach(entity => {
      if (entity.state === EntityState.FINISHED) {
        entity.dispose();
        // Entity not added to activeEntities (removed)
      } else {
        activeEntities.push(entity);
      }
    });
    
    return activeEntities;
  }
}
```

## Entity Lifecycle Integration

### Required Entity Methods
```typescript
abstract class Entity {
  // Lifecycle methods called by UpdateSystem
  onInitialize(): void { /* Override in subclasses */ }
  onPlay(): void { /* Override in subclasses */ }
  onPause(): void { /* Override in subclasses */ }
  onUnpause(): void { /* Override in subclasses */ }
  onFinish(): void { /* Override in subclasses */ }
  
  // Update methods called during PLAYING/PAUSED states
  abstract updatePlaying(deltaTime: number): void;
  updatePaused(deltaTime: number): void { /* Usually empty */ }
  
  // Cleanup method
  abstract dispose(): void;
}
```

### Progression Tracking
```typescript
class UpdateSystem {
  private updateProgression(entity: Entity, deltaTime: number): void {
    if (entity.hasDuration()) {
      entity.elapsedTime += deltaTime;
      entity.progression = Math.min(entity.elapsedTime / entity.duration, 1.0);
      
      // Auto-finish when duration reached
      if (entity.progression >= 1.0) {
        this.transitionEntityState(entity, EntityState.FINISHED);
      }
    }
  }
}
```

## Error Handling

### Graceful Degradation
```typescript
class UpdateSystem {
  private updateEntity(entity: Entity, deltaTime: number): void {
    try {
      // ... normal update logic
    } catch (error) {
      console.error(`Error updating entity ${entity.name}:`, error);
      
      // Mark entity as finished to prevent further errors
      entity.setState(EntityState.FINISHED);
    }
  }
}
```

### Debug Information
```typescript
class UpdateSystem {
  private debugEnabled: boolean = false;
  
  enableDebug(): void {
    this.debugEnabled = true;
  }
  
  private logStateTransition(entity: Entity, oldState: EntityState, newState: EntityState): void {
    if (this.debugEnabled) {
      console.log(`Entity ${entity.name}: ${oldState} → ${newState}`);
    }
  }
}
```

## Performance Considerations

### Batch Processing
- Entities processed in single loop for cache efficiency
- State transitions validated before applying
- Finished entities removed in batch after processing

### Memory Management
- Automatic cleanup of finished entities
- Behavior removal when completed
- Resource disposal through entity.dispose()

### Early Termination
```typescript
class UpdateSystem {
  process(entities: Entity[], deltaTime: number): void {
    // Skip processing if deltaTime is too large (frame skip)
    if (deltaTime > 0.1) { // 100ms threshold
      console.warn('Large deltaTime detected, skipping frame');
      return;
    }
    
    // ... normal processing
  }
}
```

## Integration with Scene System

### Scene Usage Pattern
```typescript
class Scene {
  protected updateSystem = new UpdateSystem();
  
  update(deltaTime: number): void {
    // UpdateSystem processes all entities in scene
    this.updateSystem.process(this.entities, deltaTime);
  }
  
  pause(): void {
    this.updateSystem.pauseEntities(this.entities);
  }
  
  resume(): void {
    this.updateSystem.resumeEntities(this.entities);
  }
}
```

## Future Enhancements

### Priority-Based Processing
- Critical entities updated first
- Non-essential entities skipped during performance issues

### Entity Groups
- Batch operations on entity collections
- Group-based state management

### Advanced Behavior System
- Behavior dependencies and ordering
- Conditional behavior activation
- Behavior state persistence