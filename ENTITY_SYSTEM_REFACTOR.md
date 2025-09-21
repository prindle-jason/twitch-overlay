# Entity System Refactor Plan

## Overview
Refactor the current entity system to address poor design decisions that make entity cloning difficult and the architecture fragile. Move to TypeScript for better type safety and developer experience.

## Core Problems
1. **Tight Coupling**: Behaviors require parent references at construction time, making cloning impossible
2. **Dual Architecture**: Two different entity systems (new Entity vs old Element) create confusion
3. **Constructor Complexity**: Heavy logic in constructors (resource loading, calculations) makes initialization fragile
4. **Missing Lifecycle**: No proper dispose/cleanup methods leading to memory leaks
5. **Direct Coupling**: Components directly call parent methods instead of using events
6. **Unnecessary Middleware**: overlay-server.js adds complexity when Streamer.bot has WebSocket server

## Target Architecture

### Server-Client Architecture
- **Server-Side Scene Management**: All entity logic, behaviors, and scene state managed on overlay-server.js
- **Client-Side Rendering**: Lightweight browser clients execute render commands from server
- **Automatic Pause/Resume**: Scenes pause when no clients connected, resume when clients connect
- **Render Command Protocol**: Server sends high-level drawing instructions (drawImage, drawText, etc.) to clients
- **Perfect Synchronization**: Multiple clients render identical content from single source of truth

### Entity System (Server-Side)
- **Behavior Manager**: Deferred attachment system allowing behaviors to be attached/detached without parent injection
- **Event System**: Decoupled communication between entities using EventBus pattern
- **Resource Management**: Centralized resource loading with reference counting and cleanup on server
- **Clean Lifecycle**: Separate initialize() and dispose() methods for proper setup/teardown
- **TypeScript**: Type safety for configurations and APIs

### WebSocket Architecture
- **Streamer.bot Integration**: overlay-server.js connects directly to Streamer.bot WebSocket server
- **Event Subscription**: Use Streamer.bot's native event system to trigger server-side effects
- **Client Communication**: WebSocket connection between overlay-server.js and browser clients for render commands

## Implementation Phases

### Phase 1: Foundation
- Convert to TypeScript
- Add proper logging system (remove console.log spam)
- Implement dispose() methods for cleanup
- Move resource loading out of constructors

### Phase 2: Behavior System
- Implement BehaviorManager with deferred attachment
- Create EventBus for decoupled communication
- Refactor existing behaviors to use new system

### Phase 3: WebSocket Simplification
- Remove overlay-server.js middleware
- Implement direct Streamer.bot WebSocket connection
- Update client to use Streamer.bot event subscription model

### Phase 4: Polish
- Lazy behavior initialization for dynamic entity information
- Improved developer experience with hot reload
- Documentation and examples

## Detailed Implementation Steps

1. **Setup TypeScript Foundation** ✅ (Completed)
   - Configure TypeScript build system, update package.json with TS dependencies, create tsconfig.json, and establish project structure with proper source and build directories

2. **Design Server-Client Architecture**
   - Establish server-side scene management with client-side rendering approach, define render command protocol, implement client connection management with automatic pause/resume when no clients connected

3. **Implement Core Event System**
   - Create EventBus class for decoupled communication between entities, define event types, and implement event subscription/unsubscription patterns (server-side focused)

4. **Build Resource Management System**
   - Create centralized resource loader with reference counting, lazy loading, and proper cleanup mechanisms on server, with resource ID references in render commands to client

5. **Design New Entity Architecture**
   - Create base Entity class with proper lifecycle methods (initialize/dispose) for server-side entities, remove constructor complexity, and establish component attachment patterns

6. **Implement Behavior Manager**
   - Create BehaviorManager with deferred attachment system on server, allowing behaviors to be attached/detached without parent injection at construction time

7. **Create Effect Management System**
   - Rebuild EffectManager to work with new server-side entity system, supporting effect triggering and state management on server with render command generation

8. **Implement Streamer.bot WebSocket Integration**
   - Connect overlay-server.js directly to Streamer.bot WebSocket server, implement event subscription model, and trigger server-side effects from Streamer.bot events

9. **Build Client Rendering System**
   - Create lightweight client renderer that executes render commands from server, implement WebSocket client for receiving render frames, add canvas drawing utilities

10. **Refactor Core Behaviors**
    - Convert existing behaviors (HueCycle, Jitter, Opacity, etc.) to new TypeScript server-side system using EventBus communication and deferred attachment

11. **Port Key Effects and Scenes**
    - Recreate essential effects (ZeldaChest, Confetti, DvdEffect, etc.) using the new server-side architecture, generating appropriate render commands for client rendering

12. **Testing and Documentation**
    - Create usage examples, document the new server-client architecture, and verify all success criteria including automatic pause/resume and multi-client synchronization

## Success Criteria
- Server-side scenes can be easily managed and modified without client restarts
- Scenes automatically pause when no clients connected (resource efficiency)
- Multiple clients render perfectly synchronized content
- No memory leaks or resource cleanup issues on server
- Simplified deployment with overlay-server.js handling both scene logic and client communication
- Type-safe configuration and APIs
- Hot reload capability for scene modifications during development
- Maintainable codebase with clear server-client separation

## Migration Notes
- No backward compatibility required
- Old Element/Effect system will be removed after refactor
- Focus on developer experience and code quality over performance optimization