# RenderSystem Architecture

## Overview
RenderSystem handles visual rendering of entities to the canvas. It leverages Canvas 2D transform capabilities for efficient rendering without complex world coordinate calculations.

## Core Responsibilities
- **Tree Traversal**: Process entity hierarchies for rendering
- **Transform Application**: Apply local transforms using Canvas 2D API
- **Visibility Culling**: Skip invisible or transparent entities
- **Render Order**: Ensure correct z-index and layer ordering
- **Canvas State Management**: Proper save/restore of canvas context

## Canvas-Driven Transform Approach

### Why Canvas Transforms?
```typescript
// Instead of complex world coordinate math:
// worldX = parentWorldX + (localX * parentScaleX * cos(parentRotation))
// worldY = parentWorldY + (localY * parentScaleY * sin(parentRotation))

// Canvas API handles this naturally:
ctx.save();
ctx.translate(entity.x, entity.y); // Canvas computes final position
ctx.rotate(entity.rotation);
ctx.scale(entity.scaleX, entity.scaleY);
entity.renderSelf(ctx); // Entity draws in local coordinates
ctx.restore();
```

### Benefits
- **Performance**: No manual transform calculations
- **Accuracy**: Browser-optimized transform math
- **Simplicity**: Entities render in local coordinate space
- **Composability**: Transforms naturally compose through hierarchy

## Core Implementation

### Main Rendering Method
```typescript
class RenderSystem {
  process(entities: Entity[], ctx: CanvasRenderingContext2D): void {
    // Clear previous frame (typically done by SceneManager)
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render entity tree with transform hierarchy
    entities.forEach(entity => {
      this.renderEntityTree(entity, ctx);
    });
  }
  
  private renderEntityTree(entity: Entity, ctx: CanvasRenderingContext2D): void {
    // Apply transform if entity has spatial properties
    if (entity instanceof TransformEntity) {
      ctx.save();
      this.applyLocalTransform(entity, ctx);
    }
    
    // Render entity if it's renderable and visible
    if (entity instanceof RenderableEntity && this.shouldRender(entity)) {
      entity.renderSelf(ctx);
    }
    
    // Render children (inherit transform context)
    entity.children.forEach(child => {
      this.renderEntityTree(child, ctx);
    });
    
    // Restore transform context
    if (entity instanceof TransformEntity) {
      ctx.restore();
    }
  }
}
```

### Transform Application
```typescript
class RenderSystem {
  private applyLocalTransform(entity: TransformEntity, ctx: CanvasRenderingContext2D): void {
    // Order matters: Translate → Rotate → Scale
    
    // 1. Translate to entity position
    ctx.translate(entity.x, entity.y);
    
    // 2. Rotate around entity center
    if (entity.rotation !== 0) {
      ctx.rotate(entity.rotation);
    }
    
    // 3. Scale rendering
    if (entity.scaleX !== 1 || entity.scaleY !== 1) {
      ctx.scale(entity.scaleX, entity.scaleY);
    }
    
    // Note: Anchor point handling happens in entity.renderSelf()
  }
}
```

### Anchor Point Handling
```typescript
class ImageEntity extends RenderableEntity {
  renderSelf(ctx: CanvasRenderingContext2D): void {
    if (!this.image || !this.image.complete) return;
    
    // Apply opacity
    ctx.globalAlpha = this.worldOpacity;
    
    // Draw image with anchor point offset
    const offsetX = -this.width * this.anchorX;
    const offsetY = -this.height * this.anchorY;
    
    ctx.drawImage(
      this.image,
      offsetX, offsetY,
      this.width, this.height
    );
  }
}
```

## Visibility and Culling

### Visibility Checks
```typescript
class RenderSystem {
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
    // - Frustum culling (off-screen)
    // - Occlusion culling (behind opaque objects)
    
    return true;
  }
}
```

### Opacity Processing
```typescript
class RenderSystem {
  // Update world opacity before rendering
  private updateWorldOpacity(entities: Entity[]): void {
    entities.forEach(entity => {
      this.updateEntityOpacity(entity, 1.0); // Start with full opacity
    });
  }
  
  private updateEntityOpacity(entity: Entity, parentOpacity: number): void {
    if (entity instanceof RenderableEntity) {
      // Calculate world opacity
      entity.worldOpacity = parentOpacity * entity.opacity;
      
      // Update world visibility
      entity.worldVisible = entity.visible && 
                           parentOpacity > 0.001 && 
                           entity.opacity > 0.001;
    }
    
    // Propagate to children
    const childOpacity = entity instanceof RenderableEntity ? 
                        entity.worldOpacity : parentOpacity;
    
    entity.children.forEach(child => {
      this.updateEntityOpacity(child, childOpacity);
    });
  }
}
```

## Render Layers and Z-Index

### Layer System
```typescript
interface RenderLayer {
  name: string;
  zOrder: number;
}

const RENDER_LAYERS = {
  BACKGROUND: { name: 'background', zOrder: 0 },
  GAME: { name: 'game', zOrder: 100 },
  UI: { name: 'ui', zOrder: 200 },
  DEBUG: { name: 'debug', zOrder: 300 }
};
```

### Advanced Rendering with Layers
```typescript
class RenderSystem {
  processWithLayers(entities: Entity[], ctx: CanvasRenderingContext2D): void {
    // Build render queue sorted by layer and z-index
    const renderQueue = this.buildRenderQueue(entities);
    
    // Render in correct order
    renderQueue.forEach(item => {
      ctx.save();
      this.applyWorldTransform(item.entity, ctx);
      item.entity.renderSelf(ctx);
      ctx.restore();
    });
  }
  
  private buildRenderQueue(entities: Entity[]): RenderItem[] {
    const queue: RenderItem[] = [];
    
    this.collectRenderableEntities(entities, queue, 0); // depth = 0
    
    // Sort by: layer z-order → entity z-index → tree depth
    queue.sort((a, b) => {
      if (a.layer.zOrder !== b.layer.zOrder) {
        return a.layer.zOrder - b.layer.zOrder;
      }
      if (a.entity.zIndex !== b.entity.zIndex) {
        return a.entity.zIndex - b.entity.zIndex;
      }
      return a.depth - b.depth; // Parents before children
    });
    
    return queue;
  }
}
```

## Performance Optimizations

### Frustum Culling
```typescript
class RenderSystem {
  private isInViewport(entity: TransformEntity, viewBounds: Rectangle): boolean {
    // Calculate entity bounds in world space (if needed)
    const entityBounds = this.getEntityBounds(entity);
    
    // Check intersection with viewport
    return this.rectanglesIntersect(entityBounds, viewBounds);
  }
  
  private getEntityBounds(entity: TransformEntity): Rectangle {
    // For simple cases, use entity size
    return {
      x: entity.x - (entity.width * entity.anchorX),
      y: entity.y - (entity.height * entity.anchorY),
      width: entity.width,
      height: entity.height
    };
  }
}
```

### Canvas State Optimization
```typescript
class RenderSystem {
  private stateStack: CanvasState[] = [];
  
  private optimizedSave(ctx: CanvasRenderingContext2D): void {
    // Only save if transform will actually change
    const currentState = this.getCurrentState(ctx);
    this.stateStack.push(currentState);
    ctx.save();
  }
  
  private optimizedRestore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
    this.stateStack.pop();
  }
}
```

### Batch Rendering
```typescript
class RenderSystem {
  private batchSimilarEntities(entities: RenderableEntity[]): EntityBatch[] {
    const batches = new Map<string, EntityBatch>();
    
    entities.forEach(entity => {
      const batchKey = this.getBatchKey(entity);
      
      if (!batches.has(batchKey)) {
        batches.set(batchKey, new EntityBatch(batchKey));
      }
      
      batches.get(batchKey)!.addEntity(entity);
    });
    
    return Array.from(batches.values());
  }
  
  private getBatchKey(entity: RenderableEntity): string {
    // Group by texture, blend mode, etc.
    return `${entity.texture?.src || 'none'}_${entity.blendMode || 'normal'}`;
  }
}
```

## Integration with Entity Types

### RenderableEntity Interface
```typescript
abstract class RenderableEntity extends TransformEntity {
  abstract renderSelf(ctx: CanvasRenderingContext2D): void;
  
  // Optional render bounds for culling
  getRenderBounds(): Rectangle {
    return {
      x: -this.width * this.anchorX,
      y: -this.height * this.anchorY,
      width: this.width,
      height: this.height
    };
  }
}
```

### Common Entity Implementations
```typescript
class ShapeEntity extends RenderableEntity {
  renderSelf(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.worldOpacity;
    ctx.fillStyle = this.color;
    
    const bounds = this.getRenderBounds();
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }
}

class TextEntity extends RenderableEntity {
  renderSelf(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.worldOpacity;
    ctx.fillStyle = this.color;
    ctx.font = this.font;
    ctx.textAlign = 'center';
    
    ctx.fillText(this.text, 0, 0); // Draw at origin (transforms applied)
  }
}
```

## Error Handling

### Graceful Rendering Failures
```typescript
class RenderSystem {
  private renderEntityTree(entity: Entity, ctx: CanvasRenderingContext2D): void {
    try {
      // ... normal rendering logic
    } catch (error) {
      console.error(`Render error for entity ${entity.name}:`, error);
      
      // Continue rendering other entities
      // Restore canvas state if needed
      if (entity instanceof TransformEntity) {
        ctx.restore();
      }
    }
  }
}
```

## Scene Integration

### Scene Usage Pattern
```typescript
class Scene {
  protected renderSystem = new RenderSystem();
  
  render(ctx: CanvasRenderingContext2D): void {
    this.renderSystem.process(this.entities, ctx);
  }
}
```

## Future Enhancements

### Advanced Visual Effects
- **Blend Modes**: Additive, multiply, overlay rendering
- **Filters**: Blur, glow, drop shadow effects
- **Masks**: Clipping and stencil operations
- **Shaders**: Custom fragment shaders for effects

### Performance Features
- **Dirty Regions**: Only redraw changed areas
- **Level of Detail**: Simplified rendering at distance
- **Instanced Rendering**: Batch identical sprites
- **Texture Atlasing**: Reduce draw calls

### Debug Features
- **Wireframe Mode**: Show entity bounds
- **Transform Gizmos**: Visualize transform hierarchy
- **Performance Overlay**: Render timing information
- **Entity Inspector**: Highlight selected entities