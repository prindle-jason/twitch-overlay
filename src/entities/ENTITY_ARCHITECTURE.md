# Entity Architecture Design

## Key Architectural Decisions

### 1. Manager-Driven Updates
- **Entities DON'T decide their own update logic**
- **Managers look at entity state** to determine what functions to call
- Entities provide methods like `onPlay()`, `onUpdate()`, `onFinish()`
- Managers orchestrate the calling based on state transitions

### 2. Entity States (Enhanced State Machine)
```typescript
enum EntityState {
  CONSTRUCTED = 'constructed',   // Constructor finished, not yet initialized
  INITIALIZED = 'initialized',   // initialize() called, ready to start
  PLAYING = 'playing',           // Active and updating
  PAUSED = 'paused',            // Temporarily stopped (still draws, doesn't update)
  FINISHED = 'finished'          // Done, ready for cleanup
}
```

**State Behaviors:**
- **CONSTRUCTED**: Constructor has finished, entity exists but awaits initialization
- **INITIALIZED**: initialize() has been called, entity is ready to start playing
- **PLAYING**: Active updates, progression advances
- **PAUSED**: No updates/progression, but still renders (if renderable)
- **FINISHED**: No updates, no progression, ready for cleanup
- **DISABLED**: Not updated at all, won't change state, won't progress

**State Flow:**
`CONSTRUCTED` → `INITIALIZED` → `PLAYING` ↔ `PAUSED` → `FINISHED`

### 3. Lifecycle Method Naming Convention

**State Entry Callbacks (called once when entering state):**
```typescript
onInitialize(): void     // CONSTRUCTED → INITIALIZED
onPlay(): void          // INITIALIZED → PLAYING (first time only)
onPause(): void         // PLAYING → PAUSED
onUnpause(): void       // PAUSED → PLAYING (resume)
onFinish(): void        // * → FINISHED
```

**Continuous Update Callbacks (called every frame while in state):**
```typescript
updatePlaying(deltaTime: number): void   // Every frame while PLAYING
updatePaused(deltaTime: number): void    // Every frame while PAUSED (if needed)
```

**State Transition Flow with Callbacks:**
```
CONSTRUCTED → onInitialize() → INITIALIZED
INITIALIZED → onPlay() → PLAYING
PLAYING → onPause() → PAUSED
PAUSED → onUnpause() → PLAYING
* → onFinish() → FINISHED
```

**Design Principles:**
- **`on*`** = "when this happens" (entry events, called once)
- **`update*`** = "while this is ongoing" (continuous updates)
- **Symmetric transitions**: Every state change has its own callback if needed
- **Clear intent**: `onPlay()` for first-time setup, `onUnpause()` for resume logic

### 4. Child vs Behavior Separation
```typescript
class BaseEntity {
  children: BaseEntity[]     // Child entities (hierarchical)
  behaviors: Behavior[]      // Attached behaviors (composition)
}
```

### 5. Progression System
- **Progression (0-1)** only relevant during PLAYING/PAUSED states
- **isFinished()** instead of isComplete (consistent with EntityState.FINISHED)
- **State check methods**: `isConstructed()`, `isInitialized()`, `isPlaying()`, `isPaused()`, `isFinished()`

### 6. Clean Constructors
- **NO vague config objects**
- **Explicit parameters** that make sense
- **Constructor does minimal work** - heavy lifting in `initialize()`

### 7. Inheritance Hierarchy
```
BaseEntity
├── TransformEntity (adds position, rotation, scale)
│   └── RenderableEntity (adds draw capabilities)
│       ├── ImageEntity
│       ├── ShapeEntity
│       └── etc.
├── AudioEntity (no transform needed)
├── TimerEntity (no transform needed)
└── etc.
```

### 8. No Transform in BaseEntity
- **BaseEntity**: Core lifecycle, state, progression, children/behaviors
- **TransformEntity**: Adds x, y, rotation, scale, opacity
- **RenderableEntity**: Adds draw() method (extends TransformEntity)
- **Reason**: Some entities don't have position (audio, timers, etc.)

### 9. Cloning Support
- Entities can be cloned without parent references
- Parent-child relationships established via `addChild()` after creation
- Behaviors attached via BehaviorManager after creation

## Implementation Phases

**Phase 2a: Core BaseEntity**
1. BaseEntity with state management and progression
2. EntityState enum
3. Clean constructors and lifecycle methods

**Phase 2b: Transform Hierarchy**
1. TransformEntity extends BaseEntity
2. RenderableEntity extends TransformEntity

**Phase 2c: Manager Integration**
1. Update logic moves to managers
2. State-driven function calling
3. Behavior attachment system

## Success Criteria
- [x] Entities can be cloned without parent reference issues
- [x] Clear constructor parameters (no config objects)
- [x] Progression system works during PLAYING/PAUSED states
- [x] Clean separation of concerns (base vs transform vs renderable)
- [x] Manager-driven update logic based on entity state
- [x] Separate children and behaviors lists
- [x] Consistent lifecycle method naming (onPlay, onPause, onUnpause, etc.)