# Twitch Overlay Project - AI Agent Instructions

## Architecture Overview

This is a TypeScript Twitch stream overlay system with a **client-server architecture** using WebSocket communication:

- **Server** (`src/server/`): Express HTTP + WebSocket hub broadcasting events to clients
- **Overlay Client** (`src/overlay/`): Canvas-based renderer displaying visual effects in OBS
- **Dashboard Client** (`src/dashboard/`): Control interface for triggering effects and adjusting settings

Events flow: Dashboard/External API → Server (`/event` POST or WebSocket) → Broadcast → Overlay renders effect

## Core Element System

The project uses a **hierarchical element tree** similar to scene graphs:

- **`Element`** (`src/elements/Element.ts`): Base class with lifecycle states (`NEW` → `INITIALIZING` → `READY` → `PLAYING` → `FINISHED`)

  - Manages parent/child relationships automatically
  - State transitions cascade: calling `play()` on parent starts all READY children
  - Elements self-remove from parent when FINISHED
  - Children are updated and culled automatically

- **`SceneElement`** (`src/elements/scenes/SceneElement.ts`): Top-level container managed by `SceneManager`

  - Regular scenes create new instance per trigger
  - **`TriggerableSceneElement`**: Persistent scenes that handle multiple triggers (e.g., `DvdScene` adds DVDs to pool instead of creating new scenes)

- **Behaviors as Children**: Add capabilities by attaching child elements (not mixins/inheritance)
  ```typescript
  element.addChild(new TranslateBehavior({ startX: 0, endX: 100, ... }));
  element.addChild(new FadeInOutBehavior({ fadeInTime: 0.5 }));
  ```

## Creating New Scenes

1. **Create scene class** extending `SceneElement` or `TriggerableSceneElement` in `src/elements/scenes/`
2. **Register in SceneFactory** (`src/core/SceneFactory.ts`):
   ```typescript
   private static pools: Record<PoolId, SceneFactoryFn[]> = {
     myEffect: [(p) => new MyEffectScene(p as MyPayload)],
   }
   ```
3. **Export from index** (`src/elements/scenes/index.ts`)
4. **Add PoolId type** in `src/utils/types.ts`

Multi-variant pools (like `success: [SsbmSuccessScene, BamSuccessScene]`) pick random factory on trigger.

## Key Patterns

### Lifecycle Management

- **Never manually set state** - use `init()`, `play()`, `finish()` methods
- **Async loading**: Override `init()`, call `super.init()` last (after children exist)
- **Duration**: Set `this.duration` in constructor; parent auto-finishes child when elapsed
- **Progress**: `getProgress()` returns 0-1 based on elapsed/duration, inherits from parent if duration is -1

### Image Handling

Use `ImageElement` (not raw images) - auto-detects and handles static/animated (GIF/WebP):

```typescript
const img = new ImageElement({ imageUrl: "/path/to/image.gif", scale: 0.5 });
```

### Transform Hierarchy

`TransformElement` provides position/rotation/scale with canvas transform stack. Behaviors like `TranslateBehavior` manipulate parent's transform properties.

### Resource Loading

- Images: Use `ImageLoader.load()` for decoded frames of animations
- Audio: `SoundElement` with resource URL, respects `masterVolume` setting
- Audio and images tracked in version control: `public/audio/` and `public/images/`

## Development Workflow

### Build & Run

```bash
npm run dev:watch    # Build + start server + watch both client and server
npm run build        # Production build (client via Vite, server via tsc)
npm start           # Run built server
```

**Watch mode runs 3 concurrent processes**: server runtime + client watch + server watch

### Key URLs (default port 8787)

- Overlay: `http://127.0.0.1:8787/` (add as Browser Source in OBS)
- Dashboard: `http://127.0.0.1:8787/dashboard`
- Trigger Event: `POST http://127.0.0.1:8787/event` with `{ "poolId": "success", "payload": {} }`

### WebSocket Protocol

Clients connect to `/overlay-ws` and send role assignment:

```json
{ "type": "register", "role": "overlay" } // or "dashboard"
```

Message types in `src/server/ws-types.ts`: `scene-event`, `set-settings`, `get-stats`, `clear-scenes`

## Project Structure Specifics

- **Multiple entry points**: Vite builds both `index.html` (overlay) and `dashboard.html` (dashboard)
- **Dual tsconfig**: `tsconfig.json` for client (Vite), `tsconfig.server.json` for server (Node ESM)
- **Logging**: Use `logger` from `src/utils/logger.ts` - centralizes console output with timestamps
- **Type definitions**: Pool IDs in `src/utils/types.ts`, WebSocket messages in `src/server/ws-types.ts`

## Common Tasks

**Add a behavior to scene**:

```typescript
this.addChild(new GravityBehavior({ gravity: 980, bounce: 0.7 }));
```

**Test scene from dashboard**: Register pool in SceneFactory → Add button in `dashboard.html` → Hook in `DashboardController.hookSceneButtons()`

**Access canvas dimensions in scene**: Use `this.W` and `this.H` (inherited from SceneElement)
