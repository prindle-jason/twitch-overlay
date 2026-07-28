# DataImageElement Redesign Plan — With Testable Milestones

## Context

**Problem:** Image dimensions in DataImageElement are unknown until after init() completes and the image loads asynchronously. This is incompatible with data-driven scene building where all element dimensions should be deterministic from the JSON config.

**Goal:** Build DataImageElement as a standalone, data-driven implementation with dimensions known immediately, and verify each feature with working scenes.

## Architecture Overview

### Class Hierarchy

DataImageElement (abstract base, extends DataElement)
├── DataStaticImageElement (static images: PNG, JPEG, SVG)
└── DataAnimatedImageElement (animated images: GIF, WebP)

Factory: DataImageElement.create(config) -> DataStaticImageElement | DataAnimatedImageElement

### Key Design Principles

1. Width/Height Always Required — Dimensions determined at construction time from config
2. Scale Strategies — fit (default), fill, stretch (no none)
3. Async Loading Doesn't Block Dimensions — Image loads in init(), dimensions known immediately
4. Standalone Implementation — Not a wrapper (follows DataSoundElement pattern)

## Implementation Milestones (Testable)

### Milestone 1: Static Image — Basic Rendering
**What:** Implement DataStaticImageElement, verify rendering at specified dimensions

**Implementation:**
- Create abstract DataImageElement base class with config validation (width/height required)
- Implement DataStaticImageElement to load and render static images
- Implement factory to detect image type and return subclass

**Test Scene:** examples/scenes/data-driven-static-image-basic.json
- Single 400x300px image
- Placed at (100, 100)

**User Validation:**
- Image renders at correct size and position
- Dimensions queryable before play()

### Milestone 2-4: Static Image Scale Strategies (fit, fill, stretch)
**What:** Test each scale strategy with appropriate images

**Milestone 2 (fit):** 500x500px box, 1000x500px image -> scales to 500x250px
**Milestone 3 (fill):** 500x500px box, 500x1000px image -> scales to fill
**Milestone 4 (stretch):** 400x300px box, 500x500px image -> distorts to 400x300px

**User Validation:**
- Each strategy produces expected visual result
- No rendering errors

### Milestone 5: Animated Image — Basic Playback
**What:** Implement DataAnimatedImageElement, verify animation plays

**Implementation:**
- Implement DataAnimatedImageElement to load and render animated sequences
- Create SequenceElement child for frame management
- Implement frame rendering to offscreen canvas

**Test Scene:** examples/scenes/data-driven-animated-image-basic.json
- Animated GIF or WebP (200x200px)
- Strategy: fit

**User Validation:**
- Animation visible and smooth
- Dimensions known immediately
- Playback stops when scene finishes

### Milestone 6: Animated Image — Scale Strategies
**What:** Verify fit/fill/stretch work with animated images

**Test Scene:** examples/scenes/data-driven-animated-image-scaling.json
- Multiple animated GIFs, one with each strategy

**User Validation:**
- Animations play correctly with different strategies
- No distortion/rendering issues

### Milestone 7: Complex Layout — Multiple Images
**What:** Data-driven scene demonstrating why this architecture matters

**Test Scene:** examples/scenes/data-driven-image-grid.json
- 3x3 grid of images (mix of static and animated)
- Positioned relative to each other using known dimensions
- All dimensions known upfront from JSON

**User Validation:**
- All 9 images render correctly positioned
- No layout jitter
- Clean professional appearance

### Milestone 8: Backward Compatibility
**What:** Verify existing ImageElement scenes still work

**Test:**
- Load an existing scene using non-data-driven ImageElement
- Verify unchanged rendering

**User Validation:**
- Existing scenes render identically
- No regression

## Implementation Phases

### Phase 1: Core Infrastructure
- Create abstract DataImageElement base class
- Define config interface (imageUrl, width, height, scaleStrategy)
- Implement factory to detect static vs. animated

### Phase 2: Static Images (Test Milestones 1-4)
- Implement DataStaticImageElement
- Integrate ImageLoader
- Implement drawSelf() for static rendering
- Create and verify test scenes

### Phase 3: Animated Images (Test Milestones 5-6)
- Implement DataAnimatedImageElement
- Create SequenceElement child
- Implement frame canvas rendering
- Create and verify test scenes

### Phase 4: Integration (Test Milestones 7-8)
- Test complex layouts
- Verify backward compatibility
- Debug and refine

## Files to Modify

1. src/data-elements/primitives/DataImageElement.ts — Complete rewrite with subclasses
2. src/data-elements/index.ts — Update registry

## Files to Create (Test Scenes)

- examples/scenes/data-driven-static-image-basic.json
- examples/scenes/data-driven-static-image-fit.json
- examples/scenes/data-driven-static-image-fill.json
- examples/scenes/data-driven-static-image-stretch.json
- examples/scenes/data-driven-animated-image-basic.json
- examples/scenes/data-driven-animated-image-scaling.json
- examples/scenes/data-driven-image-grid.json

## Success Criteria

✓ Each milestone scene loads and runs without errors
✓ Dimensions are known before play()
✓ Static images render at correct scale/position
✓ Animated images play smoothly with correct scale
✓ All three strategies produce expected results
✓ Multiple images render correctly positioned
✓ Existing ImageElement scenes unchanged
