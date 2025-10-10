# System Integration Issues

This document lists the entity interface issues discovered while building the core systems. These are conflicts between what the systems expect and what the current entity implementations provide.

## RenderSystem Issues

### Issue 1: RenderableEntity.renderSelf() is protected
**Problem**: RenderSystem needs to call `entity.renderSelf(ctx)` but the method is marked as `protected`, making it inaccessible from outside the class hierarchy.

**Current Code**: 
```typescript
// In RenderableEntity.ts
protected abstract renderSelf(ctx: CanvasRenderingContext2D): void;
```

**Systems Expectation**: RenderSystem needs to call this method directly to render entities.

**Potential Solutions**:
1. Change `protected` to `public` in RenderableEntity
2. Add a public `render()` method that RenderSystem can call instead
3. Make RenderSystem a friend class (not possible in TypeScript)

**Current Workaround**: RenderSystem calls the method anyway, resulting in a compile error that can be ignored at runtime.

---

## TransformSystem Issues

### Issue 2: Missing parent tracking in Entity hierarchy
**Problem**: TransformSystem needs to traverse parent chains to compute world transforms, but entities don't currently track their parent.

**Current Code**: Entity has `children` array but no `parent` reference.

**Systems Expectation**: Ability to walk up the parent chain from any entity to compute inherited transforms.

**Potential Solutions**:
1. Add `parent: Entity | null` property to Entity base class
2. Maintain parent-child relationships automatically in `addChild()`/`removeChild()`
3. Pass parent context through system processing instead of storing it

**Current Workaround**: TransformSystem has a placeholder `findParent()` method that returns null, so parent transforms are not applied.

### Issue 3: Missing dirty flag management in TransformEntity
**Problem**: TransformSystem expects to be notified when entity transforms change to invalidate cached world coordinates.

**Current Code**: TransformEntity properties (`x`, `y`, `rotation`, etc.) are public fields with no change notification.

**Systems Expectation**: Transform property setters should call `TransformSystem.markDirty(this)` when values change.

**Potential Solutions**:
1. Convert transform properties to getter/setter pairs that notify the system
2. Add explicit `markDirty()` calls where transforms are modified
3. Use a reactive system or property observers

**Current Workaround**: TransformSystem marks entities as dirty when explicitly requested, but automatic dirty flagging on transform changes is not implemented.

---

## UpdateSystem Issues

### Issue 4: No major issues found
**Status**: UpdateSystem works with current entity interfaces. All required lifecycle methods (`onInitialize()`, `onPlay()`, `updatePlaying()`, etc.) are properly defined in the Entity base class.

---

## Summary

The systems are functional as MVPs but have the following integration gaps:

1. **RenderableEntity.renderSelf()** needs to be made public for RenderSystem
2. **Entity parent tracking** needs to be added for proper TransformSystem hierarchy support
3. **Transform dirty flagging** needs to be integrated into TransformEntity property setters

These issues don't prevent the systems from working but limit their functionality until the entity interfaces are updated to match the expected contracts.