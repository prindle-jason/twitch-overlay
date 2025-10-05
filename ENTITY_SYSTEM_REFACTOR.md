# Entity System Refactor Plan

## Overview
Refactor the current entity system to address poor design decisions that make entity cloning difficult and the architecture fragile. Move to TypeScript for better type safety and developer experience.

## Core Problems
1. **Tight Coupling**: Behaviors require parent references at construction time, making cloning impossible
2. **Dual Architecture**: Two different entity systems (new Entity vs old Element) create confusion
3. **Constructor Complexity**: Heavy logic in constructors (resource loading, calculations) makes initialization fragile
4. **Missing Lifecycle**: No proper dispose/cleanup methods leading to memory leaks
5. **Direct Coupling**: Components directly call parent methods instead of using decoupled communication
6. **Behavior Coordination**: Multiple behaviors need to share state (like duration progress) but currently duplicate tracking

## Target Architecture

### Simplified Client-Side Architecture
- **Client-Side Only**: Keep everything in the browser for simplicity
- **Direct Streamer.bot Connection**: Use existing TypeScript StreamerbotManager for WebSocket communication
- **Static Resource Serving**: Vite dev server handles images/audio efficiently
- **No Middleware**: Eliminated overlay-server.js complexity

### Entity System Design
- **Behavior Manager**: Deferred attachment system allowing behaviors to be attached/detached without parent injection
- **Entity Progression**: Universal progress tracking built into Entity (time-based, event-based, or manual)
- **Resource Management**: Centralized resource loading with reference counting and cleanup
- **Clean Lifecycle**: Separate initialize() and dispose() methods for proper setup/teardown
- **TypeScript**: Type safety for configurations and APIs
- **Scene Coordination**: Scene entities handle cross-entity communication manually (no global EventBus)

## Implementation Phases

### Phase 1: Foundation ✅ (Completed)
- Convert to TypeScript
- Add proper logging system (remove console.log spam)
- Implement dispose() methods for cleanup
- Move resource loading out of constructors

### Phase 2: Core Entity Architecture
- Create Entity with universal progression tracking (progress: 0-1)
- Implement proper lifecycle methods (initialize/dispose)
- Remove constructor complexity
- Design clean parent-child entity relationships

### Phase 3: Behavior System
- Implement BehaviorManager with deferred attachment
- Enable behaviors to coordinate through entity progression state
- Refactor existing behaviors to use new system

### Phase 4: Resource Management
- Create centralized resource loader with reference counting
- Implement lazy loading and proper cleanup mechanisms
- Integrate with client-side Vite resource serving

### Phase 5: Effects and Scenes
- Rebuild EffectManager to work with new entity system
- Port key effects (ZeldaChest, Confetti, DvdEffect, etc.)
- Implement scene-level coordination for cross-entity communication

### Phase 6: Polish
- Create comprehensive examples and documentation
- Verify no memory leaks or resource cleanup issues
- Optimize for developer experience and maintainability

## Detailed Implementation Steps

1. **Setup TypeScript Foundation** ✅ (Completed)
   - Configure TypeScript build system, update package.json with TS dependencies, create tsconfig.json, and establish project structure with proper source and build directories

2. **Simplify WebSocket Architecture** ✅ (Completed)
   - Remove overlay-server.js middleware (moved to archive), connect directly to Streamer.bot WebSocket from client, simplify the architecture

3. **Design New Entity Architecture**
   - Create Entity class with universal progression tracking (progress: 0-1, isComplete: boolean)
   - Implement proper lifecycle methods (initialize/dispose) and remove constructor complexity
   - Establish clean parent-child entity relationships without tight coupling

4. **Implement Behavior Manager**
   - Create BehaviorManager with deferred attachment system, allowing behaviors to be attached/detached without parent injection at construction time
   - Enable behavior coordination through entity progression state (entity.getProgress())

5. **Build Resource Management System**
   - Create centralized resource loader with reference counting, lazy loading, and proper cleanup mechanisms
   - Integrate with Vite's static file serving for efficient client-side resource management

6. **Create Effect Management System**
   - Rebuild EffectManager to work with new entity system, supporting effect triggering and state management
   - Implement scene-level coordination for cross-entity communication

7. **Refactor Core Behaviors**
   - Convert existing behaviors (HueCycle, Jitter, Opacity, etc.) to new TypeScript system using deferred attachment
   - Update behaviors to use entity progression state for coordination instead of individual duration tracking

8. **Port Key Effects and Scenes**
   - Recreate essential effects (ZeldaChest, Confetti, DvdEffect, etc.) using the new entity architecture
   - Implement proper lifecycle management and behavior coordination

9. **Testing and Documentation**
   - Create usage examples, document the new entity architecture
   - Verify no memory leaks, proper cleanup, and entity cloning capabilities

## Success Criteria
- Entities can be easily cloned without parent reference issues
- Behaviors can be attached/detached without parent injection at construction time
- Universal entity progression system eliminates behavior coordination duplication
- No memory leaks or resource cleanup issues
- Simplified client-side architecture with direct Streamer.bot integration
- Type-safe configuration and APIs throughout
- Maintainable codebase with clear entity-behavior separation
- Scene entities can coordinate cross-entity communication when needed

## Migration Notes
- No backward compatibility required
- Old Element/Effect system will be removed after refactor
- Focus on simplicity and developer experience over complex architectural patterns
- Client-side only approach eliminates server deployment complexity

## Key Architectural Decisions Made
- **No Global EventBus**: Too complex for primary use case of parent-child behavior coordination
- **Entity Progression Built-In**: Universal progress tracking (0-1) in Entity since progression is fundamental to all entities
- **BehaviorManager Coordination**: Handles deferred attachment and behavior-to-behavior communication when needed
- **Client-Side Only**: Eliminated server-client complexity in favor of simple browser-based approach
- **Scene Manual Coordination**: Cross-entity communication handled explicitly by scene entities rather than through global events