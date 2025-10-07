# System Architecture

## Overview
Systems handle specific aspects of entity processing using a hybrid tree-traversal approach. Each system has a focused responsibility and operates on entities in a coordinated manner.

## System Types

### 1. UpdateSystem
**Responsibility**: Entity lifecycle and state management

```typescript
class UpdateSystem {
  process(entities: Entity[], deltaTime: number): void
}
```

**Functions**:
- Handle entity state transitions (CONSTRUCTED → INITIALIZED → PLAYING → FINISHED)
- Call appropriate lifecycle methods (onInitialize, onPlay, updatePlaying, etc.)
- Process behaviors attached to entities
- Manage entity lifecycle (creation, destruction)

**Processing Pattern**:
```typescript
switch (entity.state) {
  case EntityState.CONSTRUCTED:
    entity.onInitialize();
    entity.setState(EntityState.INITIALIZED);
    break;
  case EntityState.PLAYING:
    entity.updatePlaying(deltaTime);
    // Update behaviors
    break;
}
```

### 2. TransformSystem
**Responsibility**: Spatial coordinate calculations

```typescript
class TransformSystem {
  process(entities: Entity[]): void
}
```

**Functions**:
- Calculate world coordinates from local transforms + parent hierarchy
- Handle dirty flag optimization (only update when needed)
- Propagate transform changes to children
- Maintain world bounds for collision/culling

**Processing Pattern**:
```typescript
if (entity instanceof TransformEntity && entity.dirty) {
  entity.worldX = parentWorldX + (entity.x * parentWorldScaleX);
  entity.worldY = parentWorldY + (entity.y * parentWorldScaleY);
  // ... other transform calculations
  entity._markClean();
}
```

### 3. RenderSystem  
**Responsibility**: Visual rendering to canvas

```typescript
class RenderSystem {
  process(entities: Entity[], ctx: CanvasRenderingContext2D): void
}
```

**Functions**:
- Traverse entity tree for renderable entities
- Apply world transforms to canvas context
- Call renderSelf() on RenderableEntity instances
- Handle visibility culling
- Manage canvas state (save/restore)

**Processing Pattern**:
```typescript
if (entity instanceof TransformEntity) {
  ctx.save();
  this.applyWorldTransform(entity, ctx);
}

if (entity instanceof RenderableEntity && entity.visible) {
  entity.renderSelf(ctx);
}

// Render children with inherited transforms
entity.children.forEach(child => this.renderEntityTree(child, ctx));

if (entity instanceof TransformEntity) {
  ctx.restore();
}
```

## Scene-Based System Coordination
**Responsibility**: Each scene owns and coordinates its own systems

```typescript
abstract class Scene {
  protected entities: Entity[] = [];
  protected updateSystem = new UpdateSystem();
  protected renderSystem = new RenderSystem();
  protected transformSystem?: TransformSystem; // Optional - only if collision needed
  protected behaviorManager = new BehaviorManager();

  constructor(needsCollision: boolean = false) {
    if (needsCollision) {
      this.transformSystem = new TransformSystem();
    }
  }

  // Main scene update loop
  update(deltaTime: number): void {
    // Phase 1: Update entity lifecycle and behaviors
    this.updateSystem.process(this.entities, deltaTime, this.behaviorManager);
    
    // Phase 2: World coordinates calculated on-demand (if collision system exists)
    // No explicit transform processing - handled lazily by TransformSystem
  }

  // Main scene render loop  
  render(ctx: CanvasRenderingContext2D): void {
    // Phase 3: Render using Canvas transforms
    this.renderSystem.process(this.entities, ctx);
  }

  // Scene control methods
  pause(): void {
    this.updateSystem.pauseEntities(this.entities);
  }

  resume(): void {
    this.updateSystem.resumeEntities(this.entities);
  }

  destroy(): void {
    this.updateSystem.destroyEntities(this.entities);
    this.entities = [];
  }
}
```

### SceneManager Coordination
```typescript
class SceneManager {
  private activeScenes = new Map<string, Scene>();

  frame(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update all active scenes
    this.activeScenes.forEach(scene => {
      scene.update(deltaTime);
    });
    
    // Render all active scenes (overlapping)
    this.activeScenes.forEach(scene => {
      scene.render(ctx);
    });
    
    // Remove finished scenes
    this.cleanupFinishedScenes();
  }

  private cleanupFinishedScenes(): void {
    const finishedScenes: string[] = [];
    this.activeScenes.forEach((scene, key) => {
      if (scene.isFinished()) {
        scene.destroy();
        finishedScenes.push(key);
      }
    });
    
    finishedScenes.forEach(key => {
      this.activeScenes.delete(key);
    });
  }
}
```

## System Coordination

### Phase Separation
1. **Update Phase**: Modify entity state, progress, and local transforms
2. **Transform Phase**: Calculate world coordinates from local transforms
3. **Render Phase**: Draw entities using world coordinates (read-only)

### Synchronization Benefits
- **Scene Isolation**: Each scene manages its own entity processing
- **Predictable Order**: Updates always happen before rendering within each scene
- **No Cross-Scene Interference**: Scenes cannot affect each other's entities
- **Efficient Batching**: Each system processes scene entities in one pass
- **Easy Testing**: Scenes and systems can be tested independently
- **Optional Complexity**: Only scenes that need collision create TransformSystem

### Data Flow
```
SceneManager.frame() → Scene.update() → Scene.render()
                          ↓                ↓
                    UpdateSystem         RenderSystem
                    + BehaviorManager    (Canvas Transforms)
                          ↓
                    TransformSystem
                    (On-demand for collision)
```

## Tree Traversal Strategy

### Hybrid Approach Benefits
- **Logical Structure**: Parent-child relationships preserved in tree
- **System Efficiency**: Each system optimized for its specific task
- **Flexible Processing**: Can handle mixed entity types in hierarchy
- **Performance**: Only process entities that need updates

### Handling Mixed Hierarchies
```
Entity (no transform)
├── TransformEntity (has position)
│   └── RenderableEntity (draws)
└── AudioEntity (no position, no rendering)
```

**Each system handles this correctly**:
- UpdateSystem: Processes all entity types
- TransformSystem: Only processes TransformEntity instances
- RenderSystem: Skips non-renderable entities, continues traversal

## Error Handling

### System Isolation
- Systems catch and log their own errors
- Failed entity processing doesn't crash other systems
- Graceful degradation (skip problematic entities)

### Debug Support
- Systems can log processing statistics
- Entity state inspection tools
- Performance profiling per system

## Future Extensions

### Additional Systems
- **BehaviorSystem**: Process entity behaviors separately
- **CollisionSystem**: Handle entity interactions
- **AnimationSystem**: Manage property animations
- **CullingSystem**: Skip processing for off-screen entities

### Performance Optimizations
- **Parallel Processing**: Systems could run in parallel where safe
- **Spatial Partitioning**: Optimize collision and culling systems
- **Component Pools**: Reduce garbage collection
- **Dirty Region Tracking**: Only redraw changed screen areas

## Usage Example
```typescript
// Setup
const sceneManager = new SceneManager();

// Create scenes with different system requirements
const visualScene = new XJasonScene(); // No collision needed
const interactiveScene = new ZeldaChestScene(true); // Needs collision

sceneManager.addScene('xjason', visualScene);
sceneManager.addScene('chest', interactiveScene);

// Game loop
function gameLoop(deltaTime: number) {
  sceneManager.frame(deltaTime, canvasContext);
  requestAnimationFrame(gameLoop);
}

// Scene-specific usage
visualScene.spawnImage(); // Only uses UpdateSystem + RenderSystem
interactiveScene.handleClick(x, y); // Uses TransformSystem for collision
```