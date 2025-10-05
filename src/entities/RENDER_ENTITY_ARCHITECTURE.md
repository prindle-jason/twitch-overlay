# RenderableEntity Architecture

## Overview
RenderableEntity extends TransformEntity to add visual rendering capabilities. It separates visual properties from spatial transforms, allowing for flexible rendering systems.

## Inheritance Hierarchy
```
Entity (base lifecycle)
  ↓
TransformEntity (spatial properties)
  ↓
RenderableEntity (visual properties)
```

## Visual Properties

### Opacity System
```typescript
// Local opacity (relative to parent)
private _opacity: number = 1;

// World opacity (final computed value)
public worldOpacity: number = 1;

// Opacity dirty flag for efficient updates
private _opacityDirty: boolean = true;

set opacity(value: number) {
  if (this._opacity !== value) {
    this._opacity = Math.max(0, Math.min(1, value)); // Clamp 0-1
    this._opacityDirty = true;
  }
}

get opacity(): number {
  return this._opacity;
}
```

### Visibility Control
```typescript
// Whether entity should be rendered
private _visible: boolean = true;

// Computed visibility (considers parent hierarchy)
public worldVisible: boolean = true;

set visible(value: boolean) {
  if (this._visible !== value) {
    this._visible = value;
    this._visibilityDirty = true;
  }
}

get visible(): boolean {
  return this._visible;
}
```

### Render Layers
```typescript
// Z-index for rendering order
private _zIndex: number = 0;

// Render layer for grouping (UI, game, background)
private _renderLayer: string = 'default';

set zIndex(value: number) {
  if (this._zIndex !== value) {
    this._zIndex = value;
    // Notify parent of z-order change
    this._notifyZIndexChange();
  }
}
```

## World Opacity Calculation

### Inheritance Formula
```typescript
// Child inherits parent's world opacity
child.worldOpacity = parent.worldOpacity * child.localOpacity;

// Example hierarchy:
// Scene (opacity: 1.0) → worldOpacity: 1.0
//   ├─ UI Panel (opacity: 0.8) → worldOpacity: 0.8
//   │   └─ Button (opacity: 0.9) → worldOpacity: 0.72
//   └─ Game Object (opacity: 1.0) → worldOpacity: 1.0
```

### Efficiency Optimizations
```typescript
// Only recalculate when local opacity changes
if (entity.opacityDirty) {
  entity.worldOpacity = parentWorldOpacity * entity.opacity;
  entity._markOpacityClean();
  
  // Mark children as dirty
  entity.children.forEach(child => {
    if (child instanceof RenderableEntity) {
      child._markOpacityDirty();
    }
  });
}
```

## Visibility System

### World Visibility Logic
```typescript
// Entity is world-visible if:
// 1. It's locally visible AND
// 2. Parent is world-visible AND  
// 3. World opacity > 0
child.worldVisible = child.visible && 
                    parent.worldVisible && 
                    child.worldOpacity > 0;
```

### Culling Optimizations
```typescript
// Skip rendering invisible entities and their children
if (!entity.worldVisible) {
  return; // Skip entire subtree
}

// Skip rendering if completely transparent
if (entity.worldOpacity <= 0.001) {
  return; // Skip entire subtree
}
```

## Abstract Rendering Interface

### Core Rendering Method
```typescript
abstract class RenderableEntity extends TransformEntity {
  /**
   * Render this entity's visual content.
   * Called by RenderSystem after transforms are applied.
   * 
   * @param ctx Canvas context with world transform already applied
   */
  abstract renderSelf(ctx: CanvasRenderingContext2D): void;
  
  /**
   * Optional: Custom bounds for culling/collision.
   * Defaults to transform width/height if not overridden.
   */
  getRenderBounds(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
```

### Concrete Implementation Examples
```typescript
class ImageEntity extends RenderableEntity {
  renderSelf(ctx: CanvasRenderingContext2D): void {
    if (this.image && this.image.complete) {
      ctx.globalAlpha = this.worldOpacity;
      ctx.drawImage(
        this.image,
        -this.width * this.anchorX,
        -this.height * this.anchorY,
        this.width,
        this.height
      );
    }
  }
}

class ShapeEntity extends RenderableEntity {
  renderSelf(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.worldOpacity;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      -this.width * this.anchorX,
      -this.height * this.anchorY,
      this.width,
      this.height
    );
  }
}
```

## RenderSystem Integration

### Processing Pipeline
```typescript
class RenderSystem {
  process(entities: Entity[], ctx: CanvasRenderingContext2D): void {
    // Phase 1: Update world opacity/visibility
    this.updateWorldRenderProperties(entities);
    
    // Phase 2: Sort by render layer and z-index
    const renderQueue = this.buildRenderQueue(entities);
    
    // Phase 3: Render in correct order
    this.renderQueue(renderQueue, ctx);
  }
  
  private renderEntity(entity: RenderableEntity, ctx: CanvasRenderingContext2D): void {
    // Skip invisible entities
    if (!entity.worldVisible || entity.worldOpacity <= 0.001) {
      return;
    }
    
    // Apply world transform
    ctx.save();
    this.applyWorldTransform(entity, ctx);
    
    // Entity renders itself
    entity.renderSelf(ctx);
    
    ctx.restore();
  }
}
```

### Transform Application
```typescript
private applyWorldTransform(entity: TransformEntity, ctx: CanvasRenderingContext2D): void {
  // Apply world position
  ctx.translate(entity.worldX, entity.worldY);
  
  // Apply world rotation
  if (entity.worldRotation !== 0) {
    ctx.rotate(entity.worldRotation);
  }
  
  // Apply world scale
  if (entity.worldScaleX !== 1 || entity.worldScaleY !== 1) {
    ctx.scale(entity.worldScaleX, entity.worldScaleY);
  }
  
  // Note: Opacity is handled by RenderableEntity.renderSelf()
}
```

## Render Layers and Z-Index

### Layer System
```typescript
interface RenderLayer {
  name: string;
  zOrder: number; // Layer ordering
}

const RENDER_LAYERS = {
  BACKGROUND: { name: 'background', zOrder: 0 },
  GAME: { name: 'game', zOrder: 100 },
  UI: { name: 'ui', zOrder: 200 },
  DEBUG: { name: 'debug', zOrder: 300 }
};
```

### Sorting Strategy
```typescript
// Primary sort: Layer z-order
// Secondary sort: Entity z-index within layer
// Tertiary sort: Tree depth (parents before children)
renderQueue.sort((a, b) => {
  if (a.layer.zOrder !== b.layer.zOrder) {
    return a.layer.zOrder - b.layer.zOrder;
  }
  if (a.entity.zIndex !== b.entity.zIndex) {
    return a.entity.zIndex - b.entity.zIndex;
  }
  return a.treeDepth - b.treeDepth;
});
```

## Performance Considerations

### Dirty Flag System
- **Opacity Dirty**: Only recalculate world opacity when local opacity changes
- **Visibility Dirty**: Only recalculate world visibility when visibility changes
- **Render Queue Dirty**: Only rebuild render queue when z-index/layer changes

### Culling Strategies
```typescript
// Frustum culling: Skip off-screen entities
if (!this.isInViewport(entity)) {
  return;
}

// Occlusion culling: Skip entities behind opaque objects
if (this.isOccluded(entity)) {
  return;
}

// Alpha culling: Skip completely transparent entities
if (entity.worldOpacity <= 0.001) {
  return;
}
```

### Batch Rendering
```typescript
// Group entities by material/texture for efficient rendering
const batches = this.groupByRenderState(renderQueue);
batches.forEach(batch => {
  this.setRenderState(batch.state);
  batch.entities.forEach(entity => entity.renderSelf(ctx));
});
```

## Future Enhancements

### Advanced Visual Properties
- **Blend Modes**: Additive, multiply, overlay blending
- **Filters**: Blur, glow, drop shadow effects
- **Masks**: Clipping and stencil operations
- **Animations**: Property tweening and keyframe animations

### Rendering Optimizations
- **Instanced Rendering**: Batch identical objects
- **Texture Atlasing**: Reduce draw calls
- **Level-of-Detail**: Render simpler versions at distance
- **Dirty Region Tracking**: Only redraw changed areas

## Usage Example
```typescript
// Create renderable entities
const background = new ImageEntity('background');
background.renderLayer = 'background';
background.opacity = 1.0;

const player = new SpriteEntity('player');
player.renderLayer = 'game';
player.zIndex = 10;
player.opacity = 1.0;

const ui = new UIPanel('hud');
ui.renderLayer = 'ui';
ui.opacity = 0.9;

// Hierarchy affects opacity
const button = new ButtonEntity('start-button');
button.opacity = 0.8;
ui.addChild(button); // Final opacity: 0.9 * 0.8 = 0.72
```