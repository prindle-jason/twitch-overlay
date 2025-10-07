# System Processing Patterns

## Overview
This document defines how systems are expected to work, their processing patterns, coordination mechanisms, and error handling strategies. Systems are the core processing units that operate on entities within scenes.

## Core System Processing Contract

### System Interface
```typescript
interface System {
  // Main processing method - called every frame
  process(entities: Entity[], deltaTime: number, ...additionalParams: any[]): void;
  
  // Optional initialization
  initialize?(): void;
  
  // Optional cleanup
  dispose?(): void;
  
  // Optional pause/resume support
  pause?(): void;
  resume?(): void;
  
  // Optional debug information
  getDebugInfo?(): SystemDebugInfo;
}

interface SystemDebugInfo {
  name: string;
  entitiesProcessed: number;
  processingTimeMs: number;
  memoryUsage?: number;
  errors?: string[];
}
```

### Processing Lifecycle
```typescript
abstract class BaseSystem implements System {
  private _paused: boolean = false;
  private _disposed: boolean = false;
  protected _lastProcessTime: number = 0;
  protected _processedCount: number = 0;
  
  process(entities: Entity[], deltaTime: number): void {
    if (this._disposed || this._paused) return;
    
    const startTime = performance.now();
    
    try {
      this.preProcess(entities, deltaTime);
      this.processEntities(entities, deltaTime);
      this.postProcess(entities, deltaTime);
    } catch (error) {
      this.handleError(error, entities, deltaTime);
    }
    
    this._lastProcessTime = performance.now() - startTime;
  }
  
  // Override in subclasses
  protected preProcess(entities: Entity[], deltaTime: number): void {}
  protected abstract processEntities(entities: Entity[], deltaTime: number): void;
  protected postProcess(entities: Entity[], deltaTime: number): void {}
  
  protected handleError(error: Error, entities: Entity[], deltaTime: number): void {
    console.error(`System error in ${this.constructor.name}:`, error);
    // Continue processing - don't crash entire scene
  }
}
```

## System Implementations

### UpdateSystem Processing Pattern
```typescript
class UpdateSystem extends BaseSystem {
  constructor(private behaviorManager: BehaviorManager) {
    super();
  }

  protected processEntities(entities: Entity[], deltaTime: number): void {
    // Phase 1: Process entity state machine
    entities.forEach(entity => {
      this.updateEntityState(entity, deltaTime);
    });
    
    // Phase 2: Process behaviors for all entities
    this.behaviorManager.updateBehaviors(entities, deltaTime);
    
    // Phase 3: Clean up finished entities (handled by scene)
  }
  
  private updateEntityState(entity: Entity, deltaTime: number): void {
    if (entity.disabled) return;
    
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
        break;
        
      case EntityState.PAUSED:
        entity.updatePaused(deltaTime);
        break;
        
      case EntityState.FINISHED:
        entity.onFinish();
        break;
    }
  }
  
  // Scene control methods
  pauseEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      if (entity.state === EntityState.PLAYING) {
        entity.setState(EntityState.PAUSED);
        entity.onPause();
      }
    });
  }
  
  resumeEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      if (entity.state === EntityState.PAUSED) {
        entity.setState(EntityState.PLAYING);
        entity.onUnpause();
      }
    });
  }
  
  destroyEntities(entities: Entity[]): void {
    entities.forEach(entity => {
      entity.setState(EntityState.FINISHED);
      entity.onFinish();
      entity.dispose();
    });
  }
}
```

### RenderSystem Processing Pattern
```typescript
class RenderSystem extends BaseSystem {
  private renderStats = {
    entitiesRendered: 0,
    drawCalls: 0,
    skippedEntities: 0
  };

  protected preProcess(entities: Entity[], deltaTime: number): void {
    // Reset render stats
    this.renderStats = { entitiesRendered: 0, drawCalls: 0, skippedEntities: 0 };
  }

  protected processEntities(entities: Entity[], deltaTime: number, ctx: CanvasRenderingContext2D): void {
    // Render entity tree with transform hierarchy
    entities.forEach(entity => {
      this.renderEntityTree(entity, ctx);
    });
  }
  
  private renderEntityTree(entity: Entity, ctx: CanvasRenderingContext2D): void {
    try {
      // Apply transform if entity has spatial properties
      if (entity instanceof TransformEntity) {
        ctx.save();
        this.applyLocalTransform(entity, ctx);
      }
      
      // Render entity if it's renderable and visible
      if (entity instanceof RenderableEntity && this.shouldRender(entity)) {
        entity.renderSelf(ctx);
        this.renderStats.entitiesRendered++;
        this.renderStats.drawCalls++;
      } else if (entity instanceof RenderableEntity) {
        this.renderStats.skippedEntities++;
      }
      
      // Render children (inherit transform context)
      entity.children.forEach(child => {
        this.renderEntityTree(child, ctx);
      });
      
      // Restore transform context
      if (entity instanceof TransformEntity) {
        ctx.restore();
      }
    } catch (error) {
      console.error(`Render error for entity ${entity.name}:`, error);
      
      // Restore canvas state if error occurred during rendering
      if (entity instanceof TransformEntity) {
        try {
          ctx.restore();
        } catch {
          // Canvas state may be corrupted - continue anyway
        }
      }
    }
  }
  
  private shouldRender(entity: RenderableEntity): boolean {
    // Skip if not visible
    if (!entity.visible || !entity.worldVisible) {
      return false;
    }
    
    // Skip if completely transparent
    if (entity.worldOpacity <= 0.001) {
      return false;
    }
    
    // Additional culling checks could go here
    return true;
  }
  
  private applyLocalTransform(entity: TransformEntity, ctx: CanvasRenderingContext2D): void {
    // Order matters: Translate → Rotate → Scale
    ctx.translate(entity.x, entity.y);
    
    if (entity.rotation !== 0) {
      ctx.rotate(entity.rotation);
    }
    
    if (entity.scaleX !== 1 || entity.scaleY !== 1) {
      ctx.scale(entity.scaleX, entity.scaleY);
    }
  }
  
  getDebugInfo(): SystemDebugInfo {
    return {
      name: 'RenderSystem',
      entitiesProcessed: this.renderStats.entitiesRendered,
      processingTimeMs: this._lastProcessTime,
      memoryUsage: this.estimateMemoryUsage(),
      errors: [] // Track rendering errors if needed
    };
  }
}
```

### TransformSystem Processing Pattern
```typescript
class TransformSystem extends BaseSystem {
  private frameCounter: number = 0;
  private calculations: number = 0;
  private cacheHits: number = 0;

  protected preProcess(entities: Entity[], deltaTime: number): void {
    this.frameCounter++;
    this.calculations = 0;
    this.cacheHits = 0;
  }

  // TransformSystem doesn't process entities in bulk - it provides on-demand services
  protected processEntities(entities: Entity[], deltaTime: number): void {
    // No bulk processing - world coordinates calculated lazily when requested
    // This method exists to satisfy the System interface but does nothing
  }

  // Main service methods (called by other systems or collision detection)
  getWorldTransform(entity: TransformEntity): WorldTransform {
    if (entity._worldDirty || !entity._worldTransform) {
      this.computeWorldTransform(entity);
      entity._worldDirty = false;
      this.calculations++;
    } else {
      this.cacheHits++;
    }
    
    return entity._worldTransform;
  }

  getWorldBounds(entity: TransformEntity): BoundingBox {
    const worldTransform = this.getWorldTransform(entity);
    
    const halfWidth = (entity.width * worldTransform.scaleX) / 2;
    const halfHeight = (entity.height * worldTransform.scaleY) / 2;
    
    return {
      left: worldTransform.x - halfWidth,
      top: worldTransform.y - halfHeight,
      right: worldTransform.x + halfWidth,
      bottom: worldTransform.y + halfHeight,
      width: entity.width * worldTransform.scaleX,
      height: entity.height * worldTransform.scaleY
    };
  }

  pointInEntity(entity: TransformEntity, worldX: number, worldY: number): boolean {
    const bounds = this.getWorldBounds(entity);
    
    return worldX >= bounds.left && 
           worldX <= bounds.right && 
           worldY >= bounds.top && 
           worldY <= bounds.bottom;
  }

  private computeWorldTransform(entity: TransformEntity): void {
    // Build parent chain and compute transforms from root down
    const parentChain = this.buildParentChain(entity);
    
    let currentTransform: WorldTransform = {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      computedFrame: this.frameCounter
    };
    
    // Apply each parent's transform
    for (const parent of parentChain) {
      if (parent._worldDirty || !parent._worldTransform) {
        parent._worldTransform = this.combineTransforms(currentTransform, parent);
        parent._worldDirty = false;
      }
      currentTransform = parent._worldTransform;
    }
    
    // Finally compute entity's world transform
    entity._worldTransform = this.combineTransforms(currentTransform, entity);
  }

  getDebugInfo(): SystemDebugInfo {
    return {
      name: 'TransformSystem',
      entitiesProcessed: this.calculations,
      processingTimeMs: this._lastProcessTime,
      errors: [],
      cacheHitRate: this.calculations + this.cacheHits > 0 ? 
        this.cacheHits / (this.calculations + this.cacheHits) : 0
    };
  }
}
```

## System Coordination Within Scenes

### Scene System Processing Order
```typescript
abstract class Scene {
  protected updateSystem = new UpdateSystem(this.behaviorManager);
  protected renderSystem = new RenderSystem();
  protected transformSystem?: TransformSystem;
  protected behaviorManager = new BehaviorManager();

  update(deltaTime: number): void {
    try {
      // Phase 1: Update entity logic and behaviors
      this.updateSystem.process(this.entities, deltaTime);
      
      // Phase 2: Handle finished entities
      this.cleanupFinishedEntities();
      
    } catch (error) {
      console.error(`Scene update error in ${this.constructor.name}:`, error);
      // Scene continues - don't crash entire application
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    try {
      // Phase 3: Render using Canvas transforms
      this.renderSystem.process(this.entities, ctx);
      
    } catch (error) {
      console.error(`Scene render error in ${this.constructor.name}:`, error);
      
      // Try to restore canvas state
      try {
        ctx.restore();
      } catch {
        // Canvas state corrupted - may need to restart rendering context
      }
    }
  }

  private cleanupFinishedEntities(): void {
    const finishedEntities: Entity[] = [];
    
    this.entities = this.entities.filter(entity => {
      if (entity.state === EntityState.FINISHED) {
        finishedEntities.push(entity);
        return false; // Remove from array
      }
      return true; // Keep in array
    });
    
    // Dispose finished entities
    finishedEntities.forEach(entity => {
      try {
        entity.dispose();
      } catch (error) {
        console.error(`Entity disposal error for ${entity.name}:`, error);
      }
    });
  }

  // Optional collision detection support
  getEntityAtPoint(x: number, y: number): TransformEntity | null {
    if (!this.transformSystem) return null;
    
    const transformEntities = this.entities.filter(e => 
      e instanceof TransformEntity
    ) as TransformEntity[];
    
    // Check entities in reverse order (top-most rendered first)
    for (let i = transformEntities.length - 1; i >= 0; i--) {
      const entity = transformEntities[i];
      if (this.transformSystem.pointInEntity(entity, x, y)) {
        return entity;
      }
    }
    
    return null;
  }
}
```

## Error Handling Strategies

### System-Level Error Handling
```typescript
abstract class BaseSystem {
  protected errorCount: number = 0;
  protected maxErrors: number = 10;
  protected errorCooldown: number = 1000; // 1 second
  protected lastErrorTime: number = 0;

  protected handleError(error: Error, entities: Entity[], deltaTime: number): void {
    const now = Date.now();
    this.errorCount++;
    
    // Log error with context
    console.error(`System error in ${this.constructor.name}:`, {
      error: error.message,
      stack: error.stack,
      entityCount: entities.length,
      deltaTime,
      errorCount: this.errorCount
    });
    
    // Check for error flooding
    if (this.errorCount >= this.maxErrors && 
        now - this.lastErrorTime < this.errorCooldown) {
      console.error(`System ${this.constructor.name} disabled due to too many errors`);
      this.pause();
      return;
    }
    
    this.lastErrorTime = now;
    
    // System-specific error recovery
    this.recoverFromError(error, entities, deltaTime);
  }
  
  protected recoverFromError(error: Error, entities: Entity[], deltaTime: number): void {
    // Override in subclasses for specific recovery strategies
  }
}
```

### Entity-Level Error Isolation
```typescript
class UpdateSystem extends BaseSystem {
  protected processEntities(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      try {
        this.updateEntityState(entity, deltaTime);
      } catch (error) {
        this.handleEntityError(error, entity, deltaTime);
      }
    });
    
    // Behaviors are processed in batch with error isolation
    try {
      this.behaviorManager.updateBehaviors(entities, deltaTime);
    } catch (error) {
      console.error('Behavior processing error:', error);
      // BehaviorManager should handle individual behavior errors internally
    }
  }
  
  private handleEntityError(error: Error, entity: Entity, deltaTime: number): void {
    console.error(`Entity update error for ${entity.name}:`, error);
    
    // Mark entity as finished to prevent further errors
    entity.setState(EntityState.FINISHED);
    
    // Optionally create error visualization entity
    if (this.shouldCreateErrorEntity(entity)) {
      this.createErrorEntity(entity, error);
    }
  }
  
  private shouldCreateErrorEntity(entity: Entity): boolean {
    // Only in development mode or for critical entities
    return process.env.NODE_ENV === 'development';
  }
  
  private createErrorEntity(entity: Entity, error: Error): void {
    // Create visual indicator for failed entity (development only)
    // This could help with debugging visual placement issues
  }
}
```

## Performance Monitoring and Optimization

### System Performance Tracking
```typescript
class SystemProfiler {
  private systemMetrics = new Map<string, SystemMetrics>();
  
  trackSystem(systemName: string, processingTime: number, entitiesProcessed: number): void {
    const metrics = this.systemMetrics.get(systemName) || {
      totalTime: 0,
      totalEntities: 0,
      callCount: 0,
      averageTime: 0,
      averageEntities: 0,
      maxTime: 0,
      minTime: Infinity
    };
    
    metrics.totalTime += processingTime;
    metrics.totalEntities += entitiesProcessed;
    metrics.callCount++;
    metrics.averageTime = metrics.totalTime / metrics.callCount;
    metrics.averageEntities = metrics.totalEntities / metrics.callCount;
    metrics.maxTime = Math.max(metrics.maxTime, processingTime);
    metrics.minTime = Math.min(metrics.minTime, processingTime);
    
    this.systemMetrics.set(systemName, metrics);
  }
  
  getPerformanceReport(): PerformanceReport {
    const report: PerformanceReport = {};
    
    this.systemMetrics.forEach((metrics, systemName) => {
      report[systemName] = { ...metrics };
    });
    
    return report;
  }
}

interface SystemMetrics {
  totalTime: number;
  totalEntities: number;
  callCount: number;
  averageTime: number;
  averageEntities: number;
  maxTime: number;
  minTime: number;
}
```

### Performance-Aware Scene Processing
```typescript
abstract class Scene {
  private profiler = new SystemProfiler();
  private targetFrameTime: number = 16.67; // 60 FPS
  private performanceMode: 'full' | 'reduced' | 'minimal' = 'full';

  update(deltaTime: number): void {
    const frameStart = performance.now();
    
    // Adjust processing based on performance mode
    switch (this.performanceMode) {
      case 'full':
        this.fullUpdate(deltaTime);
        break;
      case 'reduced':
        this.reducedUpdate(deltaTime);
        break;
      case 'minimal':
        this.minimalUpdate(deltaTime);
        break;
    }
    
    const frameTime = performance.now() - frameStart;
    this.adjustPerformanceMode(frameTime);
  }
  
  private fullUpdate(deltaTime: number): void {
    const updateStart = performance.now();
    this.updateSystem.process(this.entities, deltaTime);
    this.profiler.trackSystem('UpdateSystem', performance.now() - updateStart, this.entities.length);
    
    this.cleanupFinishedEntities();
  }
  
  private reducedUpdate(deltaTime: number): void {
    // Skip some non-critical entities or behaviors
    const criticalEntities = this.entities.filter(e => e.priority >= EntityPriority.HIGH);
    
    const updateStart = performance.now();
    this.updateSystem.process(criticalEntities, deltaTime);
    this.profiler.trackSystem('UpdateSystem', performance.now() - updateStart, criticalEntities.length);
  }
  
  private minimalUpdate(deltaTime: number): void {
    // Only update essential entities
    const essentialEntities = this.entities.filter(e => e.priority >= EntityPriority.CRITICAL);
    
    const updateStart = performance.now();
    this.updateSystem.process(essentialEntities, deltaTime);
    this.profiler.trackSystem('UpdateSystem', performance.now() - updateStart, essentialEntities.length);
  }
  
  private adjustPerformanceMode(frameTime: number): void {
    if (frameTime > this.targetFrameTime * 1.5) {
      // Frame is taking too long - reduce quality
      if (this.performanceMode === 'full') {
        this.performanceMode = 'reduced';
      } else if (this.performanceMode === 'reduced') {
        this.performanceMode = 'minimal';
      }
    } else if (frameTime < this.targetFrameTime * 0.8) {
      // Frame is fast - can increase quality
      if (this.performanceMode === 'minimal') {
        this.performanceMode = 'reduced';
      } else if (this.performanceMode === 'reduced') {
        this.performanceMode = 'full';
      }
    }
  }
}
```

## Testing and Validation

### System Testing Patterns
```typescript
describe('UpdateSystem', () => {
  let updateSystem: UpdateSystem;
  let behaviorManager: BehaviorManager;
  let mockEntities: Entity[];

  beforeEach(() => {
    behaviorManager = new BehaviorManager();
    updateSystem = new UpdateSystem(behaviorManager);
    mockEntities = createMockEntities();
  });

  it('should process entity state transitions correctly', () => {
    const entity = new MockEntity('test');
    expect(entity.state).toBe(EntityState.CONSTRUCTED);
    
    updateSystem.process([entity], 16);
    expect(entity.state).toBe(EntityState.PLAYING);
    
    updateSystem.process([entity], 16);
    expect(entity.state).toBe(EntityState.PLAYING);
  });

  it('should handle entity errors gracefully', () => {
    const faultyEntity = new FaultyEntity('error-test');
    const normalEntity = new MockEntity('normal');
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    updateSystem.process([faultyEntity, normalEntity], 16);
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(faultyEntity.state).toBe(EntityState.FINISHED);
    expect(normalEntity.state).toBe(EntityState.PLAYING);
    
    consoleErrorSpy.mockRestore();
  });

  it('should process behaviors through BehaviorManager', () => {
    const entity = new MockEntity('test');
    const behavior = new MockBehavior('test-behavior');
    
    behaviorManager.attachBehavior(entity, behavior);
    
    updateSystem.process([entity], 16);
    
    expect(behavior.updateCallCount).toBeGreaterThan(0);
  });
});
```

This system processing pattern provides robust, error-resistant, and performance-aware processing while maintaining clear separation of concerns and easy testability.