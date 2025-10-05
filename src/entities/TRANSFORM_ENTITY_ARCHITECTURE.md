# TransformEntity Architecture

## Overview
TransformEntity extends Entity to add spatial properties (position, rotation, scale) with efficient dirty-flag based updates.

## Key Principles
- **Local vs World Coordinates**: Clear separation between relative and absolute positioning
- **Dirty Flag System**: Only recalculate transforms when properties change
- **No Parent References**: Entity doesn't store parent data, preventing cloning issues
- **System-Driven Updates**: TransformSystem handles all world coordinate calculations

## Transform Properties

### Local Transform (Relative to Parent)
```typescript
// Position relative to parent
private _x: number = 0;
private _y: number = 0;

// Scale relative to parent
private _scaleX: number = 1;
private _scaleY: number = 1;

// Rotation relative to parent (radians)
private _rotation: number = 0;

// Anchor point for transforms (0-1 normalized)
private _anchorX: number = 0.5;
private _anchorY: number = 0.5;

// Size for bounds calculations
private _width: number = 0;
private _height: number = 0;
```

### World Transform (Final Absolute Coordinates)
```typescript
// Calculated by TransformSystem
public worldX: number = 0;
public worldY: number = 0;
public worldScaleX: number = 1;
public worldScaleY: number = 1;
public worldRotation: number = 0;
```

### Dirty Flag System
```typescript
private _dirty: boolean = true;

// Any setter that changes transform marks dirty
set x(value: number) {
  if (this._x !== value) {
    this._x = value;
    this._dirty = true;
  }
}
```

## Transform Calculations

### World Transform Formula
```
child.worldX = parent.worldX + (child.localX * parent.worldScaleX)
child.worldY = parent.worldY + (child.localY * parent.worldScaleY)
child.worldScaleX = parent.worldScaleX * child.localScaleX
child.worldScaleY = parent.worldScaleY * child.localScaleY
child.worldRotation = parent.worldRotation + child.localRotation
```

### Efficiency Optimizations
- **Dirty Flag**: Only recalculate when local properties change
- **Cascade Updates**: When parent updates, mark all children dirty
- **Batch Processing**: TransformSystem processes all updates in single pass

## World Bounds Calculation
```typescript
// Computed properties for world-space bounds
get worldLeft(): number {
  return this.worldX - (this.width * this.anchorX * this.worldScaleX);
}

get worldRight(): number {
  return this.worldX + (this.width * (1 - this.anchorX) * this.worldScaleX);
}

get worldTop(): number {
  return this.worldY - (this.height * this.anchorY * this.worldScaleY);
}

get worldBottom(): number {
  return this.worldY + (this.height * (1 - this.anchorY) * this.worldScaleY);
}
```

## API Design

### Individual Property Access
```typescript
entity.x = 100;           // Set local X position
entity.rotation = Math.PI; // Set local rotation
console.log(entity.worldX); // Read final world position
```

### Convenience Methods
```typescript
// Bulk updates
entity.setPosition(x, y);
entity.setScale(scaleX, scaleY);
entity.setSize(width, height);

// Getters
const pos = entity.getPosition(); // { x, y }
const bounds = entity.getWorldBounds(); // { left, top, right, bottom }
```

## Example Hierarchy
```typescript
const scene = new Entity("scene");           // Root
const player = new TransformEntity("player"); // Local: (100, 50)
const weapon = new TransformEntity("weapon"); // Local: (20, 0)

scene.addChild(player);
player.addChild(weapon);

// After TransformSystem processes:
player.worldX = 100;  // No parent transform
player.worldY = 50;
weapon.worldX = 120;  // 100 + 20
weapon.worldY = 50;   // 50 + 0
```

## Integration with Systems
- **UpdateSystem**: Modifies local transform properties during gameplay
- **TransformSystem**: Calculates world coordinates from local + parent
- **RenderSystem**: Uses world coordinates for drawing
- **No circular dependencies**: Clean system separation

**Note**: Opacity is handled by RenderableEntity, not TransformEntity. This separation allows non-visual entities (like audio or logic entities) to have transforms without visual properties.

## Future Enhancements
- **Z-depth**: Add z-coordinate for 3D layering
- **Matrix Optimization**: Use transformation matrices for complex rotations
- **Interpolation**: Smooth transform animations
- **Visibility Culling**: Skip transform calculations for off-screen entities