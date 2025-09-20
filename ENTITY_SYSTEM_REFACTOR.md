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

### Entity System
- **Behavior Manager**: Deferred attachment system allowing behaviors to be attached/detached without parent injection
- **Event System**: Decoupled communication between entities using EventBus pattern
- **Resource Management**: Centralized resource loading with reference counting and cleanup
- **Clean Lifecycle**: Separate initialize() and dispose() methods for proper setup/teardown
- **TypeScript**: Type safety for configurations and APIs

### WebSocket Architecture
- **Direct Connection**: Client connects directly to Streamer.bot WebSocket server
- **Event Subscription**: Use Streamer.bot's native event system instead of custom HTTP endpoints
- **Static Files**: Simple file server or file:// protocol for overlay assets

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

## Success Criteria
- Entities can be easily cloned/templated
- Behaviors can be attached/detached at runtime
- No memory leaks or resource cleanup issues
- Simplified deployment (no middleware server)
- Type-safe configuration and APIs
- Maintainable codebase for future development

## Migration Notes
- No backward compatibility required
- Old Element/Effect system will be removed after refactor
- Focus on developer experience and code quality over performance optimization