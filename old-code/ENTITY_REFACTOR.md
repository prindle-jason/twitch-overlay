# Entity System Refactor

## Overview

This document outlines a major refactor of the twitch-overlay foundation system to unify Effects, Elements, and Behaviors into a single Entity-based architecture. The current system has artificial distinctions and limitations that this refactor will address.

## Current Problems

### 1. Artificial Effect/Element Distinction
- Effects and Elements have nearly identical lifecycles (`onPlay`, `update`, `draw`, `onFinish`)
- Effects contain Elements, but both manage state and timing
- ZeldaChestEffect essentially acts as a composite element that happens to inherit from BaseEffect
- No clear reason why Effects can contain Elements but Elements can't contain other Elements

### 2. Missing Parent-Child Hierarchy
- Elements cannot have child elements, limiting composition
- Complex objects like ZeldaChest manually manage drawing order and cleanup
- No transform inheritance (child positions relative to parent)
- Missing automatic cleanup when parent is removed

### 3. Inconsistent Lifecycle Management
- Elements sometimes manage their own timing (`TimedImageElement.getProgress()`)
- Other times they delegate to effects (`BaseElement.getProgress()`)
- No standardized way for elements to signal they should be removed
- Behaviors can be added to playing elements with inconsistent `onPlay` timing

### 4. Bad Practice Behaviors
- `ImageScaleBehavior` is a one-time property set, not a dynamic behavior
- Immediate property configuration should be handled in constructor/config, not through behaviors
- If it's not changing over time, it shouldn't be a behavior class

### 5. State Management Issues
- Effects use string states but elements don't have formal states
- No way to pause/resume entities
- No distinction between graceful finishing vs immediate termination
- Manual state tracking in individual effects

## Proposed Solution: Unified Entity System

### Core Concept
**Everything is an Entity.** Effects, Elements, and Behaviors are all just different types of entities with different capabilities.

### Entity Base Class
```javascript
class Entity {
  constructor(config = {}) {
    this.state = EntityState.READY;
    this.parent = null;
    this.children = [];
    this.elapsed = 0;
    
    // Do initialization in constructor
    this.init(config);
  }
  
  // State machine-driven update
  update(deltaTime) {
    switch (this.state) {
      case EntityState.READY:
        this.state = EntityState.PLAYING;
        this.onPlay();
        break;
        
      case EntityState.PLAYING:
        this.elapsed += deltaTime;
        this.onUpdate(deltaTime);
        
        if (this.shouldFinish()) {
          this.state = EntityState.FINISHED;
          this.onComplete();
        }
        break;
        
      case EntityState.PAUSED:
        // Do nothing - stay paused
        break;
        
      case EntityState.FINISHED:
        // Done, parent will remove
        break;
    }
    
    this.updateChildren(deltaTime);
  }
  
  updateChildren(deltaTime) {
    this.children = this.children.filter(child => {
      child.update(deltaTime);
      return child.state !== EntityState.FINISHED;
    });
  }
  
  // Lifecycle hooks (override in subclasses)
  init(config) { /* Synchronous initialization in constructor */ }
  onPlay() { /* Called when starting to play */ }
  onUpdate(deltaTime) { /* Called every frame while playing */ }
  onComplete() { /* Called when finished */ }
  shouldFinish() { return false; } /* Override for natural finish conditions */
  
  // Public control methods
  pause() { this.state = EntityState.PAUSED; }
  resume() { this.state = EntityState.PLAYING; }
  finish() { 
    if (this.state !== EntityState.FINISHED) {
      this.state = EntityState.FINISHED;
      this.onComplete();
    }
  }
}
```

### Entity States
```javascript
const EntityState = {
  READY: 'ready',          // Constructed and ready to start
  PLAYING: 'playing',       // Active and updating
  PAUSED: 'paused',        // Temporarily stopped
  FINISHED: 'finished'      // Done, ready for removal
};
```

### Entity Type Hierarchy

#### Entity (Base class)
- Universal base class for everything in the system
- Lifecycle states, parent-child relationships, timing
- Handles all composition (no separate CompositeEntity needed)
- Universal `draw()`, `update()`, lifecycle methods
- Can have children of any type

#### TransformEntity (extends Entity)
- Has transform properties (x, y, scaleX, scaleY, rotation, opacity)
- Implements `drawSelf(ctx)` method for rendering
- Handles transform inheritance from parent
- Applies transforms before drawing self and children

```javascript
class TransformEntity extends Entity {
  constructor(config = {}) {
    super(config);
    
    // Transform properties
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.scaleX = config.scaleX || 1;
    this.scaleY = config.scaleY || 1;
    this.rotation = config.rotation || 0;
    this.opacity = config.opacity || 1;
  }
  
  draw(ctx) {
    if (this.opacity <= 0) return;
    
    ctx.save();
    this.applyTransform(ctx);
    
    // Draw self
    this.drawSelf(ctx);
    
    // Draw children
    this.children.forEach(child => child.draw(ctx));
    
    ctx.restore();
  }
  
  drawSelf(ctx) {
    // Override in subclasses
  }
  
  applyTransform(ctx) {
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.globalAlpha *= this.opacity;
  }
}
```

#### AudioEntity (extends Entity)
- Manages audio playback
- No transform properties (audio has no spatial position)
- Can still have children (visual effects that sync to audio)

### Specific Implementation Types

#### ImageEntity (extends TransformEntity)
- Displays a single image
- Basic visual building block

#### ShapeEntity (extends TransformEntity)  
- Draws geometric shapes (rectangles, circles, ellipses)
- For procedural graphics

#### ParticleEntity (extends TransformEntity)
- Individual particle for particle systems
- Essentially an ImageEntity optimized for particles

### Folder Organization

#### scenes/
Root-level entities that represent complete interactive sequences:
- `ZeldaChestEntity.js` - Complete chest opening sequence
- `ConfettiEntity.js` - Particle celebration effect  
- `DvdBounceEntity.js` - Bouncing logo animation
- `SsbmSuccessEntity.js` - SSBM success celebration

#### entities/
Reusable entity components:
- `ImageEntity.js` - Basic image display
- `AudioEntity.js` - Sound playback
- `ShapeEntity.js` - Geometric shapes (circles, rectangles)
- `ParticleEntity.js` - Individual particle

#### behaviors/
Behavior entities that modify parent properties:
- `FadeInOutEntity.js` - Opacity animation over time
- `FallingEntity.js` - Gravity physics simulation
- `RotationEntity.js` - Spinning animation
- `TimedEntity.js` - Adds duration/auto-finish to parent

### Key Features

#### 1. Automatic State Machine Lifecycle
```javascript
// Entities automatically progress through lifecycle on update()
const entity = new ImageEntity('sprite.png');
// Constructor: init() called → READY
// First update(): READY → onPlay() → PLAYING (waits for next update to start onUpdate)
// Subsequent updates: onUpdate() called each frame
// When shouldFinish() returns true: PLAYING → onComplete() → FINISHED
```

#### 2. Universal Parent-Child Hierarchy
```javascript
// Any entity can have children
const chest = new Entity();
const lid = new ImageEntity('zeldaChestLid1');
const glow = new GlowBeamEntity();
const openSound = new AudioEntity('zeldaOpenChest');

chest.addChild(lid);
chest.addChild(glow);
chest.addChild(openSound);

// Behaviors are just child entities
const fadeInBehavior = new FadeInOutEntity();
lid.addChild(fadeInBehavior);
```

#### 3. Behavior-Driven Functionality
```javascript
// No built-in duration - TimedEntity behavior adds it
const image = new ImageEntity('sprite.png'); // Plays indefinitely
const timer = new TimedEntity({ duration: 5000 }); // Adds 5-second limit
image.addChild(timer);

// Multiple behaviors can coexist and interact
image.addChild(new FadeInOutEntity({ fadeTime: 1000 }));
image.addChild(new RotationEntity({ speed: 2 }));
image.addChild(new OffScreenEntity()); // Finish when off-screen
```

#### 4. Behavior Lifecycle Control
```javascript
// Behaviors control parent lifecycle through public API
class TimedEntity extends Entity {
  onUpdate(deltaTime) {
    // Only count down when parent is playing (behavior's choice)
    if (this.parent.state === EntityState.PLAYING && 
        this.elapsed >= this.duration) {
      this.parent.finish(); // Uses public API, not direct state manipulation
    }
  }
}

// First behavior to call finish() wins
const image = new ImageEntity('sprite.png');
image.addChild(new TimedEntity({ duration: 5000 }));    // Finish at 5s
image.addChild(new OffScreenEntity());                  // Finish when off-screen
// Whichever condition happens first calls image.finish()
```

#### 5. Child Self-Management Philosophy
```javascript
// Children manage their own lifecycle when possible
class ParticleEntity extends TransformEntity {
  shouldFinish() {
    // Particle removes itself when off-screen
    return this.y > window.innerHeight + 50;
  }
}

// Parents handle children only when necessary for coordination
class ConfettiScene extends Entity {
  spawnParticle() {
    const particle = new ParticleEntity();
    this.addChild(particle); // Parent spawns, child manages its own removal
  }
}
```

#### 6. Direct Property Configuration
```javascript
// Immediate properties set in constructor, not behaviors
const image = new ImageEntity('sprite.png', {
  x: 100,
  y: 50,
  scaleX: 0.5,
  scaleY: 0.5
});

// Image-dependent behaviors can rely on dimensions being available
const slideDistance = image.width * image.scaleX; // Reliable access
image.addChild(new SlideBehavior({ distance: slideDistance }));
```

#### 7. Transform Inheritance
```javascript
// Child positions are relative to parent
chest.x = 100;
chest.y = 50;
lid.x = 0;      // Relative to chest
lid.y = -10;    // 10 pixels above chest

// When chest moves, lid moves with it automatically
chest.x = 200;  // Lid is now at world position (200, 40)
```

#### 8. Automatic Cleanup
```javascript
// Removing parent removes all children
chest.finish();  // Chest, lid, glow, sound, and all behaviors cleaned up

// Children auto-remove when finished
lid.finish();  // Lid automatically removes itself from chest
```

## Migration Strategy

### Phase 1: Create Base Entity System
1. Implement `Entity` base class with lifecycle and hierarchy
2. Implement `TransformEntity` and `AudioEntity` subclasses
3. Create state management and parent-child system

### Phase 2: Convert Elements
1. Make `BaseElement` extend `TransformEntity` (maintain compatibility)
2. Convert elements to new entities in `entities/` folder:
   - `ImageElement` → `ImageEntity`
   - `SoundElement` → `AudioEntity`
   - Remove `TimedImageElement` (replaced by ImageEntity + TimedEntity behavior)
3. Test existing effects still work

### Phase 3: Convert Behaviors  
1. Convert behaviors to entities in `behaviors/` folder:
   - `FadeInOutBehavior` → `FadeInOutEntity`
   - `FallingBehavior` → `FallingEntity`
   - `ImageScaleBehavior` → Remove (just set properties directly)
   - etc.
2. Update behavior system to use parent-child relationships
3. Remove `BaseBehavior` class

### Phase 4: Convert Effects to Scenes
1. Convert effects to entities in `scenes/` folder:
   - `ZeldaChestEffect` → `ZeldaChestEntity`
   - `ConfettiEffect` → `ConfettiEntity`
   - `DvdEffect` → `DvdBounceEntity`
2. Remove `BaseEffect` class entirely
3. Update EffectManager to SceneManager

### Phase 5: Cleanup
1. Remove old base classes
2. Update configs and factory methods
3. Add convenience methods for common patterns

## Benefits

### 1. Simplified Mental Model
- One base class to understand instead of three
- Consistent lifecycle across all objects
- Natural composition patterns

### 2. More Powerful Composition
- Any entity can contain any other entities
- Behaviors can have visual effects
- Audio can trigger visual effects
- Complex objects encapsulate their own logic

### 3. Better Performance  
- Entities organized by state for efficient updates
- Automatic cleanup prevents memory leaks
- Parent state controls when children update

### 4. Easier Debugging
- Clear parent-child relationships
- Consistent state tracking
- Explicit cleanup methods

### 5. Future Extensibility
- Easy to add new entity types
- Behaviors can be as complex as needed
- Natural place to add features like physics, collision detection, etc.

## Example Usage

### Before (Current System)
```javascript
class ZeldaChestEffect extends BaseEffect {
  constructor(config) {
    super(config);
    this.chestBody = new ImageElement('zeldaChestBody');
    this.chestLid = new ImageElement('zeldaChestLid1');
    this.elements = [this.chestBody, this.chestLid];
    
    this.chestLid.addBehavior(new ImageFadeInOutBehavior());
    // Manual management of element lifecycle...
  }
}
```

### After (Entity System)
```javascript
// scenes/ZeldaChestEntity.js
class ZeldaChestEntity extends Entity {
  constructor(config) {
    super(config);
    
    // Create and add children with immediate property configuration
    this.chestBody = new ImageEntity('zeldaChestBody');
    this.chestLid = new ImageEntity('zeldaChestLid1', { x: 0, y: -10 });
    this.openSound = new AudioEntity('zeldaOpenChest');
    
    this.addChild(this.chestBody);
    this.addChild(this.chestLid);
    this.addChild(this.openSound);
    
    // Add behaviors as child entities (no special behavior system needed)
    const fadeBehavior = new FadeInOutEntity({ fadeTime: 0.25 });
    this.chestLid.addChild(fadeBehavior);
    
    // Automatic lifecycle management!
  }
  
  spawnRupee() {
    const rupee = new ImageEntity('greenRupee');
    const falling = new FallingEntity({ gravity: 400 });
    const timer = new TimedEntity({ duration: 5000 });
    
    rupee.addChild(falling);
    rupee.addChild(timer);
    this.addChild(rupee);  // Auto-cleanup when rupee finishes itself
  }
}
```

### Simplified Examples
```javascript
// Direct property configuration instead of behaviors
const image = new ImageEntity('sprite.png', {
  x: 100,
  y: 50,
  scaleX: 0.5,
  scaleY: 0.5
});

// Add timing behavior
const timer = new TimedEntity({ duration: 5000 });
image.addChild(timer);

// Complex animation without special classes  
const logo = new ImageEntity('dvdLogo.png');
const physics = new ScreenBounceEntity();
const rotation = new RotationEntity({ speed: 2 });
const fade = new FadeInOutEntity({ fadeTime: 1.0 });

logo.addChild(physics);
logo.addChild(rotation);  
logo.addChild(fade);

// Multiple finish conditions - first one wins
logo.addChild(new TimedEntity({ duration: 10000 }));    // Finish after 10s
logo.addChild(new OffScreenEntity());                   // OR finish when off-screen

// Scene is just another entity
const scene = new Entity();
scene.addChild(logo);
```
```

## Open Questions

1. ~~**Resource Loading**: Should we pre-load all assets at startup, or keep async loading?~~ 
   **RESOLVED:** Pre-load all assets for synchronous entity initialization.

2. ~~**Update Method**: Keep traditional `update(deltaTime)` or explore event-driven alternatives?~~
   **RESOLVED:** Keep update() method as automatic state machine driver.

3. ~~**Behavior Priority**: Do we need ordering/priority for multiple behaviors on same entity?~~
   **RESOLVED:** Allow behavior interference for now. Multiple finish conditions use "first wins" approach.

4. ~~**State Transitions**: Should entities manage their own state transitions or should parents control them?~~
   **RESOLVED:** Entities self-manage via state machine. Behaviors can control parent lifecycle through public API.

5. ~~**Memory Management**: Are explicit `cleanup()` methods necessary or is GC sufficient?~~
   **RESOLVED:** Automatic cleanup via parent-child removal. Add explicit cleanup hooks if needed later.

6. **Behavior Coordination**: How should we handle behavior conflicts (e.g., multiple behaviors modifying same property)?
   **RESOLUTION:** Known limitation requiring careful behavior selection. Element priority system could help but not required for initial implementation.

7. **Performance Optimization**: Do we need state-organized children arrays, or is simple iteration sufficient?
   **RESOLVED:** Simple iteration is sufficient for typical scene counts.

8. ~~**UpdateChildren Implementation**: Define the `updateChildren(deltaTime)` method for automatic child management and removal.~~
   **RESOLVED:** Simple filter-based approach that removes finished children automatically.

9. **Immediate Property Setting**: Should immediate property configuration (like scale, position) be handled through behaviors or direct assignment?
   **RESOLVED:** Direct assignment in constructor/config. Image-dependent behaviors can rely on parent having image dimensions available.

10. **Parent-Child Lifecycle Management**: Should parents control child lifecycle or should children self-manage?
    **RESOLVED:** Prioritize the most direct approach - children self-manage when possible, parents handle children when necessary.

## Next Steps

1. Review and refine this document
2. Create prototype Entity base class
3. Test with simple use cases
4. Iterate on design before beginning migration
5. Create migration plan with backward compatibility