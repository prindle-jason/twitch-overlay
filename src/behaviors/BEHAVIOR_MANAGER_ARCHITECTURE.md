# BehaviorManager Architecture

## Overview
BehaviorManager provides deferred behavior attachment, coordination, and lifecycle management. It solves the core problems of entity cloning and behavior coordination by decoupling behavior creation from entity references.

## Core Problems Solved
- **Entity Cloning**: Behaviors can be attached without parent references at construction time
- **Behavior Coordination**: Multiple behaviors can share entity progression state
- **Dynamic Management**: Behaviors can be attached/detached during runtime
- **Resource Cleanup**: Proper behavior disposal and memory management

## Key Design Principles
- **Deferred Attachment**: Behaviors created independently, attached later via manager
- **Progression-Based Coordination**: Behaviors coordinate through entity.getProgress() rather than individual timers
- **Manager-Driven Updates**: BehaviorManager handles behavior lifecycle, not entities directly
- **Clean Separation**: Behaviors don't directly reference entities until attachment

## Core Implementation

### BehaviorManager Class
```typescript
interface BehaviorAttachment {
  behavior: Behavior;
  entity: Entity;
  attachedAt: number; // Timestamp for debugging
  enabled: boolean;
}

class BehaviorManager {
  private attachments: Map<string, BehaviorAttachment[]> = new Map();
  private behaviorIdCounter: number = 0;

  // Attach behavior to entity (deferred pattern)
  attachBehavior(entity: Entity, behavior: Behavior): string {
    const attachmentId = `${entity.id}_${behavior.name}_${++this.behaviorIdCounter}`;
    
    if (!this.attachments.has(entity.id)) {
      this.attachments.set(entity.id, []);
    }
    
    const attachment: BehaviorAttachment = {
      behavior,
      entity,
      attachedAt: Date.now(),
      enabled: true
    };
    
    this.attachments.get(entity.id)!.push(attachment);
    
    // Initialize behavior with entity reference
    behavior.onAttach(entity);
    
    return attachmentId;
  }

  // Remove specific behavior from entity
  detachBehavior(entity: Entity, behavior: Behavior): void {
    const entityAttachments = this.attachments.get(entity.id);
    if (!entityAttachments) return;

    const index = entityAttachments.findIndex(a => a.behavior === behavior);
    if (index !== -1) {
      const attachment = entityAttachments[index];
      attachment.behavior.onDetach(entity);
      entityAttachments.splice(index, 1);
    }
  }

  // Process all behaviors for all entities
  updateBehaviors(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      this.updateEntityBehaviors(entity, deltaTime);
    });
    
    // Cleanup finished behaviors
    this.cleanupFinishedBehaviors();
  }

  private updateEntityBehaviors(entity: Entity, deltaTime: number): void {
    const entityAttachments = this.attachments.get(entity.id);
    if (!entityAttachments || entity.disabled) return;

    entityAttachments.forEach(attachment => {
      if (attachment.enabled && attachment.behavior.canUpdate(entity)) {
        attachment.behavior.update(entity, deltaTime);
        
        // Mark behavior for removal if finished
        if (attachment.behavior.isFinished()) {
          attachment.enabled = false;
        }
      }
    });
  }

  private cleanupFinishedBehaviors(): void {
    this.attachments.forEach((attachments, entityId) => {
      const activeAttachments = attachments.filter(a => a.enabled);
      
      if (activeAttachments.length === 0) {
        this.attachments.delete(entityId);
      } else {
        this.attachments.set(entityId, activeAttachments);
      }
    });
  }

  // Get all behaviors for an entity
  getBehaviors(entity: Entity): Behavior[] {
    const entityAttachments = this.attachments.get(entity.id);
    return entityAttachments ? entityAttachments.map(a => a.behavior) : [];
  }

  // Enable/disable specific behaviors
  enableBehavior(entity: Entity, behavior: Behavior): void {
    this.setBehaviorEnabled(entity, behavior, true);
  }

  disableBehavior(entity: Entity, behavior: Behavior): void {
    this.setBehaviorEnabled(entity, behavior, false);
  }

  private setBehaviorEnabled(entity: Entity, behavior: Behavior, enabled: boolean): void {
    const entityAttachments = this.attachments.get(entity.id);
    if (!entityAttachments) return;

    const attachment = entityAttachments.find(a => a.behavior === behavior);
    if (attachment) {
      attachment.enabled = enabled;
    }
  }

  // Cleanup all behaviors for an entity (called during entity disposal)
  removeAllBehaviors(entity: Entity): void {
    const entityAttachments = this.attachments.get(entity.id);
    if (!entityAttachments) return;

    entityAttachments.forEach(attachment => {
      attachment.behavior.onDetach(entity);
    });

    this.attachments.delete(entity.id);
  }

  // Debug utilities
  getAttachmentCount(): number {
    let count = 0;
    this.attachments.forEach(attachments => count += attachments.length);
    return count;
  }

  getEntityBehaviorCount(entity: Entity): number {
    const entityAttachments = this.attachments.get(entity.id);
    return entityAttachments ? entityAttachments.length : 0;
  }
}
```

### Enhanced Behavior Base Class
```typescript
abstract class Behavior {
  protected _finished: boolean = false;
  
  constructor(public readonly name: string) {}

  // Called when behavior is attached to an entity
  onAttach(entity: Entity): void {
    // Override in subclasses for setup logic
  }

  // Called when behavior is detached from an entity
  onDetach(entity: Entity): void {
    // Override in subclasses for cleanup logic
  }

  // Called every frame while attached and enabled
  abstract update(entity: Entity, deltaTime: number): void;

  // Whether behavior should be updated this frame
  canUpdate(entity: Entity): boolean {
    // Default: update when entity is playing and behavior not finished
    return entity.isPlaying() && !this._finished;
  }

  // Whether behavior has completed and should be removed
  isFinished(): boolean {
    return this._finished;
  }

  // Mark behavior as finished (will be removed next frame)
  protected finish(): void {
    this._finished = true;
  }

  // Reset behavior to initial state (for reuse)
  reset(): void {
    this._finished = false;
  }
}
```

## Behavior Coordination Patterns

### Progression-Based Coordination
```typescript
// Behaviors coordinate through entity progression rather than individual timers
class FadeInOutBehavior extends Behavior {
  constructor(private fadeInEnd: number = 0.2, private fadeOutStart: number = 0.8) {
    super('fadeInOut');
  }

  update(entity: Entity, deltaTime: number): void {
    if (!(entity instanceof RenderableEntity)) return;

    const progress = entity.getProgress();
    
    if (progress <= this.fadeInEnd) {
      // Fade in phase
      entity.opacity = progress / this.fadeInEnd;
    } else if (progress >= this.fadeOutStart) {
      // Fade out phase
      const fadeProgress = (progress - this.fadeOutStart) / (1 - this.fadeOutStart);
      entity.opacity = 1 - fadeProgress;
    } else {
      // Full opacity phase
      entity.opacity = 1;
    }
  }
}

class JitterBehavior extends Behavior {
  private baseX: number = 0;
  private baseY: number = 0;
  
  constructor(private jitterRange: number = 5) {
    super('jitter');
  }

  onAttach(entity: TransformEntity): void {
    this.baseX = entity.x;
    this.baseY = entity.y;
  }

  update(entity: Entity, deltaTime: number): void {
    if (!(entity instanceof TransformEntity)) return;

    // Jitter intensity based on progression (could vary over time)
    const progress = entity.getProgress();
    const intensity = Math.sin(progress * Math.PI) * this.jitterRange; // Peaks in middle
    
    entity.x = this.baseX + (Math.random() - 0.5) * intensity;
    entity.y = this.baseY + (Math.random() - 0.5) * intensity;
  }
}
```

### Duration-Based Behaviors
```typescript
class TimedBehavior extends Behavior {
  private elapsedTime: number = 0;
  
  constructor(private duration: number) {
    super('timed');
  }

  update(entity: Entity, deltaTime: number): void {
    this.elapsedTime += deltaTime;
    
    // Update entity progression based on our timing
    entity.setProgress(this.elapsedTime / this.duration);
    
    // Finish entity when duration reached
    if (this.elapsedTime >= this.duration) {
      entity.setState(EntityState.FINISHED);
      this.finish();
    }
  }
}

class MovementBehavior extends Behavior {
  private startX: number = 0;
  private startY: number = 0;
  
  constructor(
    private deltaX: number, 
    private deltaY: number,
    private easing: EasingFunction = linear
  ) {
    super('movement');
  }

  onAttach(entity: TransformEntity): void {
    this.startX = entity.x;
    this.startY = entity.y;
  }

  update(entity: Entity, deltaTime: number): void {
    if (!(entity instanceof TransformEntity)) return;

    const progress = this.easing(entity.getProgress());
    
    entity.x = this.startX + (this.deltaX * progress);
    entity.y = this.startY + (this.deltaY * progress);
  }
}
```

## Integration with Entity System

### Entity Integration
```typescript
// Entity.ts additions for BehaviorManager integration
export abstract class Entity {
  // ... existing entity code ...

  // Convenience methods for behavior management
  addBehavior(behavior: Behavior): void {
    // Delegate to global or scene-specific BehaviorManager
    BehaviorManager.getInstance().attachBehavior(this, behavior);
  }

  removeBehavior(behavior: Behavior): void {
    BehaviorManager.getInstance().detachBehavior(this, behavior);
  }

  getBehaviors(): Behavior[] {
    return BehaviorManager.getInstance().getBehaviors(this);
  }

  // Called during entity disposal
  dispose(): void {
    // Remove all behaviors before disposing
    BehaviorManager.getInstance().removeAllBehaviors(this);
    
    // ... existing disposal code ...
  }
}
```

### UpdateSystem Integration
```typescript
class UpdateSystem {
  constructor(private behaviorManager: BehaviorManager) {}

  process(entities: Entity[], deltaTime: number): void {
    // Process entity state transitions
    entities.forEach(entity => {
      this.updateEntity(entity, deltaTime);
    });

    // Process all behaviors after entity updates
    this.behaviorManager.updateBehaviors(entities, deltaTime);
    
    // Remove finished entities
    this.cleanupFinishedEntities(entities);
  }

  private updateEntity(entity: Entity, deltaTime: number): void {
    // ... existing entity state machine logic ...
  }
}
```

## Scene Integration

### Scene-Level Behavior Management
```typescript
abstract class Scene {
  protected behaviorManager = new BehaviorManager();
  protected entities: Entity[] = [];

  // Convenience method for adding behaviors to scene entities
  addBehaviorToEntity(entity: Entity, behavior: Behavior): void {
    this.behaviorManager.attachBehavior(entity, behavior);
  }

  update(deltaTime: number): void {
    // Update entity states
    this.updateSystem.process(this.entities, deltaTime);
    
    // Behaviors are updated as part of UpdateSystem process
  }

  destroy(): void {
    // BehaviorManager automatically cleans up when entities are disposed
    this.entities.forEach(entity => entity.dispose());
    this.entities = [];
  }

  // Debug utilities
  getBehaviorStats(): { totalBehaviors: number; behaviorsByEntity: Map<string, number> } {
    const behaviorsByEntity = new Map<string, number>();
    
    this.entities.forEach(entity => {
      const count = this.behaviorManager.getEntityBehaviorCount(entity);
      if (count > 0) {
        behaviorsByEntity.set(entity.name, count);
      }
    });

    return {
      totalBehaviors: this.behaviorManager.getAttachmentCount(),
      behaviorsByEntity
    };
  }
}
```

## Entity Cloning with Behaviors

### Clone-Safe Pattern
```typescript
class ImageEntity extends RenderableEntity {
  // Store behavior creation functions, not behavior instances
  private behaviorFactories: (() => Behavior)[] = [];

  // Add behavior factory instead of behavior instance
  addBehaviorFactory(factory: () => Behavior): void {
    this.behaviorFactories.push(factory);
  }

  // Apply stored behaviors after cloning
  applyBehaviors(): void {
    this.behaviorFactories.forEach(factory => {
      const behavior = factory();
      this.addBehavior(behavior);
    });
  }

  clone(): ImageEntity {
    const cloned = super.clone() as ImageEntity;
    
    // Copy behavior factories (functions, not instances)
    cloned.behaviorFactories = [...this.behaviorFactories];
    
    return cloned;
  }
}

// Usage pattern
const template = new ImageEntity('sprite.png');
template.addBehaviorFactory(() => new FadeInOutBehavior());
template.addBehaviorFactory(() => new JitterBehavior(5));

// Clone and apply behaviors
const instance = template.clone();
instance.applyBehaviors(); // Creates fresh behavior instances
```

## Behavior Conflict Management

### Conflict Avoidance Strategies
```typescript
// 1. Property-Specific Behaviors
class OpacityBehavior extends Behavior {
  // Only modifies opacity - safe to combine with position behaviors
  update(entity: RenderableEntity, deltaTime: number): void {
    // Only touches entity.opacity
  }
}

class PositionBehavior extends Behavior {
  // Only modifies position - safe to combine with opacity behaviors
  update(entity: TransformEntity, deltaTime: number): void {
    // Only touches entity.x, entity.y
  }
}

// 2. Behavior Priority System (future enhancement)
abstract class Behavior {
  public readonly priority: number = 0; // Higher = later execution
  
  constructor(name: string, priority: number = 0) {
    super(name);
    this.priority = priority;
  }
}

// 3. Exclusive Behavior Types
enum BehaviorType {
  OPACITY = 'opacity',
  POSITION = 'position', 
  SCALE = 'scale',
  ROTATION = 'rotation',
  LIFECYCLE = 'lifecycle'
}

abstract class Behavior {
  abstract readonly type: BehaviorType;
  
  // BehaviorManager could enforce only one behavior per type
}
```

## Performance Considerations

### Efficient Updates
- **Spatial Grouping**: Only update behaviors for entities in active scenes
- **Dirty Flagging**: Skip behavior updates when entity hasn't changed
- **Behavior Pooling**: Reuse behavior instances to reduce garbage collection
- **Batch Processing**: Process all behaviors of same type together

### Memory Management
- **Automatic Cleanup**: Behaviors removed when entities disposed
- **Weak References**: Consider weak entity references for long-lived behaviors
- **Behavior Factories**: Use functions instead of instances for cloning

## Debug and Monitoring

### Development Tools
```typescript
class BehaviorDebugger {
  static logBehaviorStats(scene: Scene): void {
    const stats = scene.getBehaviorStats();
    console.log(`Total behaviors: ${stats.totalBehaviors}`);
    stats.behaviorsByEntity.forEach((count, entityName) => {
      console.log(`  ${entityName}: ${count} behaviors`);
    });
  }

  static visualizeBehaviorConflicts(entity: Entity): void {
    const behaviors = entity.getBehaviors();
    const propertyModifiers = new Map<string, Behavior[]>();
    
    behaviors.forEach(behavior => {
      // Analyze which properties each behavior modifies
      // Flag potential conflicts
    });
  }
}
```

## Future Enhancements

### Advanced Features
- **Behavior Dependencies**: Behaviors that require other behaviors
- **Conditional Behaviors**: Behaviors that activate based on entity state
- **Behavior Communication**: Behaviors that coordinate with each other
- **Behavior Templates**: Predefined behavior combinations for common patterns

### Integration Possibilities
- **Animation System**: Keyframe-based animations as behaviors
- **Physics System**: Physics behaviors for realistic movement
- **AI System**: Decision-making behaviors for autonomous entities
- **Networking**: Synchronized behaviors for multiplayer scenarios

This BehaviorManager design provides a robust foundation for behavior coordination while maintaining clean entity cloning and avoiding tight coupling between behaviors and entities.