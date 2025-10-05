# TransformSystem Architecture

## Overview
TransformSystem provides lazy world coordinate calculation for collision detection and spatial queries. Unlike rendering, which uses Canvas transforms, collision detection requires explicit world coordinates.

## Core Responsibilities
- **Lazy World Coordinate Calculation**: Compute world transforms only when requested
- **Collision Bounds**: Provide world-space bounding boxes for collision detection
- **Dirty Flag Management**: Efficiently track when transforms need recalculation
- **Parent Chain Resolution**: Handle transform inheritance through entity hierarchy

## Key Design Principles
- **Lazy Evaluation**: World coordinates calculated on-demand, not every frame
- **Canvas Independence**: Separate from rendering transform system
- **Collision Focus**: Optimized for spatial queries, not visual rendering
- **Efficient Caching**: Dirty flags prevent unnecessary recalculations

## Core Implementation

### World Transform Calculation
```typescript
interface WorldTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  computedFrame: number; // For debugging/profiling
}

class TransformSystem {
  private frameCounter: number = 0;
  
  // Main entry point for world coordinate access
  getWorldTransform(entity: TransformEntity): WorldTransform {
    if (entity._worldDirty || !entity._worldTransform) {
      this.computeWorldTransform(entity);
      entity._worldDirty = false;
    }
    
    return entity._worldTransform;
  }
}
```

### Parent Chain Resolution
```typescript
class TransformSystem {
  private computeWorldTransform(entity: TransformEntity): void {
    // Build parent chain from root to entity
    const parentChain = this.buildParentChain(entity);
    
    // Compute transforms from root down
    let currentTransform: WorldTransform = {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      computedFrame: this.frameCounter
    };
    
    // Apply each parent's transform
    for (const parent of parentChain) {
      if (parent._worldDirty || !parent._worldTransform) {
        parent._worldTransform = this.combineTransforms(
          currentTransform, 
          parent
        );
        parent._worldDirty = false;
      }
      currentTransform = parent._worldTransform;
    }
    
    // Finally compute entity's world transform
    entity._worldTransform = this.combineTransforms(currentTransform, entity);
  }
  
  private buildParentChain(entity: TransformEntity): TransformEntity[] {
    const chain: TransformEntity[] = [];
    let current = entity.parent;
    
    while (current instanceof TransformEntity) {
      chain.unshift(current); // Add to front
      current = current.parent;
    }
    
    return chain;
  }
}
```

### Transform Math
```typescript
class TransformSystem {
  private combineTransforms(
    parentWorld: WorldTransform, 
    entity: TransformEntity
  ): WorldTransform {
    const cos = Math.cos(parentWorld.rotation);
    const sin = Math.sin(parentWorld.rotation);
    
    // Scale local position by parent scale
    const scaledLocalX = entity.x * parentWorld.scaleX;
    const scaledLocalY = entity.y * parentWorld.scaleY;
    
    // Rotate scaled local position by parent rotation
    const rotatedX = scaledLocalX * cos - scaledLocalY * sin;
    const rotatedY = scaledLocalX * sin + scaledLocalY * cos;
    
    return {
      x: parentWorld.x + rotatedX,
      y: parentWorld.y + rotatedY,
      scaleX: parentWorld.scaleX * entity.scaleX,
      scaleY: parentWorld.scaleY * entity.scaleY,
      rotation: parentWorld.rotation + entity.rotation,
      computedFrame: this.frameCounter
    };
  }
}
```

## Collision Bounds Calculation

### World Space Bounding Box
```typescript
interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

class TransformSystem {
  getWorldBounds(entity: TransformEntity): BoundingBox {
    const worldTransform = this.getWorldTransform(entity);
    
    // Calculate bounds with anchor point
    const halfWidth = (entity.width * worldTransform.scaleX) / 2;
    const halfHeight = (entity.height * worldTransform.scaleY) / 2;
    
    const left = worldTransform.x - halfWidth;
    const right = worldTransform.x + halfWidth;
    const top = worldTransform.y - halfHeight;
    const bottom = worldTransform.y + halfHeight;
    
    return {
      left, top, right, bottom,
      width: right - left,
      height: bottom - top
    };
  }
  
  // More precise bounds with rotation
  getRotatedWorldBounds(entity: TransformEntity): BoundingBox {
    const worldTransform = this.getWorldTransform(entity);
    
    if (worldTransform.rotation === 0) {
      return this.getWorldBounds(entity); // Fast path for axis-aligned
    }
    
    // Calculate rotated corner points
    const corners = this.getRotatedCorners(entity, worldTransform);
    
    // Find axis-aligned bounding box of rotated corners
    const minX = Math.min(...corners.map(c => c.x));
    const maxX = Math.max(...corners.map(c => c.x));
    const minY = Math.min(...corners.map(c => c.y));
    const maxY = Math.max(...corners.map(c => c.y));
    
    return {
      left: minX, top: minY, right: maxX, bottom: maxY,
      width: maxX - minX, height: maxY - minY
    };
  }
}
```

### Anchor Point Handling
```typescript
class TransformSystem {
  private getRotatedCorners(
    entity: TransformEntity, 
    worldTransform: WorldTransform
  ): Point[] {
    const w = entity.width * worldTransform.scaleX;
    const h = entity.height * worldTransform.scaleY;
    
    // Local corners relative to anchor point
    const localCorners = [
      { x: -w * entity.anchorX, y: -h * entity.anchorY },           // Top-left
      { x: w * (1 - entity.anchorX), y: -h * entity.anchorY },      // Top-right
      { x: w * (1 - entity.anchorX), y: h * (1 - entity.anchorY) }, // Bottom-right
      { x: -w * entity.anchorX, y: h * (1 - entity.anchorY) }       // Bottom-left
    ];
    
    // Rotate and translate to world space
    const cos = Math.cos(worldTransform.rotation);
    const sin = Math.sin(worldTransform.rotation);
    
    return localCorners.map(corner => ({
      x: worldTransform.x + (corner.x * cos - corner.y * sin),
      y: worldTransform.y + (corner.x * sin + corner.y * cos)
    }));
  }
}
```

## Dirty Flag Management

### Cascade Dirty Flags
```typescript
class TransformSystem {
  markDirty(entity: TransformEntity): void {
    entity._worldDirty = true;
    
    // Mark all descendants as dirty
    this.markChildrenDirty(entity);
  }
  
  private markChildrenDirty(entity: Entity): void {
    entity.children.forEach(child => {
      if (child instanceof TransformEntity) {
        child._worldDirty = true;
        this.markChildrenDirty(child);
      }
    });
  }
}
```

### Transform Property Setters
```typescript
class TransformEntity extends Entity {
  private _x: number = 0;
  private _y: number = 0;
  private _scaleX: number = 1;
  private _scaleY: number = 1;
  private _rotation: number = 0;
  
  set x(value: number) {
    if (this._x !== value) {
      this._x = value;
      TransformSystem.markDirty(this);
    }
  }
  
  get x(): number {
    return this._x;
  }
  
  // Similar setters for y, scaleX, scaleY, rotation
  
  // Convenience methods
  setPosition(x: number, y: number): void {
    if (this._x !== x || this._y !== y) {
      this._x = x;
      this._y = y;
      TransformSystem.markDirty(this);
    }
  }
  
  setScale(scaleX: number, scaleY: number = scaleX): void {
    if (this._scaleX !== scaleX || this._scaleY !== scaleY) {
      this._scaleX = scaleX;
      this._scaleY = scaleY;
      TransformSystem.markDirty(this);
    }
  }
}
```

## Collision System Integration

### Usage in Collision Detection
```typescript
class CollisionSystem {
  constructor(private transformSystem: TransformSystem) {}
  
  checkCollisions(entities: Entity[]): void {
    const collidableEntities = entities.filter(e => 
      e instanceof TransformEntity && e.hasCollision
    ) as TransformEntity[];
    
    for (let i = 0; i < collidableEntities.length; i++) {
      for (let j = i + 1; j < collidableEntities.length; j++) {
        const entityA = collidableEntities[i];
        const entityB = collidableEntities[j];
        
        // Get world bounds (computed lazily)
        const boundsA = this.transformSystem.getWorldBounds(entityA);
        const boundsB = this.transformSystem.getWorldBounds(entityB);
        
        if (this.boundsIntersect(boundsA, boundsB)) {
          this.handleCollision(entityA, entityB);
        }
      }
    }
  }
  
  private boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
    return !(a.right < b.left || 
             a.left > b.right || 
             a.bottom < b.top || 
             a.top > b.bottom);
  }
}
```

### Point-in-Entity Queries
```typescript
class TransformSystem {
  pointInEntity(entity: TransformEntity, worldX: number, worldY: number): boolean {
    const bounds = this.getWorldBounds(entity);
    
    return worldX >= bounds.left && 
           worldX <= bounds.right && 
           worldY >= bounds.top && 
           worldY <= bounds.bottom;
  }
  
  // More precise point-in-entity for rotated entities
  pointInRotatedEntity(
    entity: TransformEntity, 
    worldX: number, 
    worldY: number
  ): boolean {
    const worldTransform = this.getWorldTransform(entity);
    
    // Transform world point to entity's local space
    const localPoint = this.worldToLocal(
      entity, 
      { x: worldX, y: worldY }, 
      worldTransform
    );
    
    // Check if local point is within entity bounds
    const halfWidth = entity.width / 2;
    const halfHeight = entity.height / 2;
    
    return localPoint.x >= -halfWidth && 
           localPoint.x <= halfWidth && 
           localPoint.y >= -halfHeight && 
           localPoint.y <= halfHeight;
  }
}
```

## Performance Optimizations

### Frame-Based Caching
```typescript
class TransformSystem {
  private frameCounter: number = 0;
  
  startFrame(): void {
    this.frameCounter++;
  }
  
  // Detect stale cached transforms
  private isTransformStale(transform: WorldTransform): boolean {
    return transform.computedFrame < this.frameCounter - 1;
  }
}
```

### Spatial Partitioning
```typescript
class TransformSystem {
  private spatialGrid: Map<string, TransformEntity[]> = new Map();
  private gridSize: number = 100;
  
  // Update spatial grid when entities move
  updateSpatialGrid(entities: TransformEntity[]): void {
    this.spatialGrid.clear();
    
    entities.forEach(entity => {
      const bounds = this.getWorldBounds(entity);
      const gridCells = this.getGridCells(bounds);
      
      gridCells.forEach(cell => {
        if (!this.spatialGrid.has(cell)) {
          this.spatialGrid.set(cell, []);
        }
        this.spatialGrid.get(cell)!.push(entity);
      });
    });
  }
  
  // Get nearby entities for collision testing
  getNearbyEntities(entity: TransformEntity): TransformEntity[] {
    const bounds = this.getWorldBounds(entity);
    const gridCells = this.getGridCells(bounds);
    const nearby = new Set<TransformEntity>();
    
    gridCells.forEach(cell => {
      const cellEntities = this.spatialGrid.get(cell) || [];
      cellEntities.forEach(e => nearby.add(e));
    });
    
    return Array.from(nearby);
  }
}
```

## Error Handling and Debug

### Transform Validation
```typescript
class TransformSystem {
  private validateTransform(entity: TransformEntity): boolean {
    const checks = [
      isFinite(entity.x) && !isNaN(entity.x),
      isFinite(entity.y) && !isNaN(entity.y),
      isFinite(entity.scaleX) && entity.scaleX > 0,
      isFinite(entity.scaleY) && entity.scaleY > 0,
      isFinite(entity.rotation) && !isNaN(entity.rotation)
    ];
    
    if (!checks.every(check => check)) {
      console.error(`Invalid transform on entity ${entity.name}:`, {
        x: entity.x, y: entity.y,
        scaleX: entity.scaleX, scaleY: entity.scaleY,
        rotation: entity.rotation
      });
      return false;
    }
    
    return true;
  }
}
```

### Performance Monitoring
```typescript
class TransformSystem {
  private stats = {
    computations: 0,
    cacheHits: 0,
    totalEntities: 0
  };
  
  getStats(): TransformStats {
    return {
      ...this.stats,
      cacheHitRate: this.stats.cacheHits / (this.stats.computations + this.stats.cacheHits)
    };
  }
  
  resetStats(): void {
    this.stats = { computations: 0, cacheHits: 0, totalEntities: 0 };
  }
}
```

## Scene Integration

### Optional Scene Usage
```typescript
class Scene {
  // TransformSystem is optional - only needed for collision
  protected transformSystem?: TransformSystem;
  
  constructor(needsCollision: boolean = false) {
    if (needsCollision) {
      this.transformSystem = new TransformSystem();
    }
  }
  
  // Called when collision detection is needed
  getEntityAtPoint(x: number, y: number): TransformEntity | null {
    if (!this.transformSystem) return null;
    
    const transformEntities = this.entities.filter(e => 
      e instanceof TransformEntity
    ) as TransformEntity[];
    
    return transformEntities.find(entity => 
      this.transformSystem!.pointInEntity(entity, x, y)
    ) || null;
  }
}
```

## Future Enhancements

### 3D Transform Support
- Z-coordinate for depth
- 3D rotation matrices
- Perspective projection

### Advanced Collision
- Convex hull collision detection
- Continuous collision detection
- Swept volumes for fast-moving objects

### Optimization Features
- Transform interpolation for smooth movement
- Predictive dirty flagging
- SIMD acceleration for batch transforms