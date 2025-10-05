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

## EntityManager
**Responsibility**: System coordination and game loop integration

```typescript
class EntityManager {
  constructor(
    private updateSystem: UpdateSystem,
    private transformSystem: TransformSystem,
    private renderSystem: RenderSystem
  ) {}

  frame(rootEntities: Entity[], deltaTime: number, ctx: CanvasRenderingContext2D): void {
    // Phase 1: Update entity logic and behaviors
    this.updateSystem.process(rootEntities, deltaTime);
    
    // Phase 2: Calculate world transforms
    this.transformSystem.process(rootEntities);
    
    // Phase 3: Render to canvas
    this.renderSystem.process(rootEntities, ctx);
  }
}
```

## System Coordination

### Phase Separation
1. **Update Phase**: Modify entity state, progress, and local transforms
2. **Transform Phase**: Calculate world coordinates from local transforms
3. **Render Phase**: Draw entities using world coordinates (read-only)

### Synchronization Benefits
- **Predictable Order**: Updates always happen before rendering
- **No Race Conditions**: Clear phase boundaries prevent conflicts
- **Efficient Batching**: Each system processes all entities in one pass
- **Easy Testing**: Systems can be tested independently

### Data Flow
```
Input Events → UpdateSystem → Entity State Changes
                ↓
Local Transform Changes → TransformSystem → World Coordinates
                ↓
World Coordinates → RenderSystem → Canvas Output
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
const entityManager = new EntityManager(
  new UpdateSystem(),
  new TransformSystem(),
  new RenderSystem()
);

// Game loop
function gameLoop(deltaTime: number) {
  entityManager.frame([sceneRoot], deltaTime, canvasContext);
  requestAnimationFrame(gameLoop);
}
```