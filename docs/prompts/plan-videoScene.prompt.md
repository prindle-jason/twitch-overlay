# Plan: Rename BrainrotScene → VideoScene with Config System

## Decisions locked

1. Separate new "Video" panel (same format as DVD panel)
2. Both DVD and Video dropdowns built dynamically at runtime from their data sources — hardcoded `<option>` tags removed from HTML
3. `stretch` without both `width`/`height` → throw in `resolveVideoConfig`
4. Drop 60-second hardcoded cap; duration driven by `loopCount × video.duration` naturally

## Key Width/Height/Scale Bug to Fix

Current `BrainrotScene` passes `width: 1080, height: 1918, scale: 0.25` to `VideoElement`.
`VideoElement.drawSelf` draws at 1080×1918px, then `TransformElement` applies `scale: 0.25` as a canvas transform on top — meaning the video is rendered at full size and then scaled down. It "works" because `positionCorner()` happens to be called with `1080 * 0.25 = 270`, but it's confusing and `scale` on `TransformElement` and the draw dimensions are both doing work.

**Fix**: `VideoScene` computes final pixel dimensions itself, passes only explicit pixel `width`/`height` to `VideoElement` (no `scale` prop), and sets x/y directly.

---

## Phase 1 — Types & Options File

1. Create `src/elements/scenes/videoOptions.ts`:
   - `VideoSizeMode = "native" | "contain" | "cover" | "stretch"` (maps to `ImageScaleStrategy` "none"/"fit"/"fill"/"stretch" from `dimensions.ts`)
   - `VideoPosition` discriminated union: `{ type: "corner"; corner: CornerPosition; padding?: number }` | `{ type: "center" }` | `{ type: "absolute"; x: number; y: number }`
   - `VideoPreset` interface: `{ label: string; videoUrl; sizeMode; width?; height?; muted?; loopCount?; fadeDurationMs?; position }`
   - `VIDEO_PRESETS` const: record keyed by name (`"surfers"`, `"oiia"`) — replaces `VIDEO_OPTIONS` array with weights
   - `VideoScenePayload` type: all `VideoPreset` fields optional except `videoUrl` (which is required unless `videoKey` is provided); plus `videoKey?: keyof typeof VIDEO_PRESETS`
   - `resolveVideoConfig(payload: VideoScenePayload): VideoPreset` — merge key defaults + overrides; throw `Error` if no `videoUrl` can be resolved, and if `sizeMode === "stretch"` but `width` or `height` is missing

2. Update `src/types/SceneTypes.ts`: `"brainrot"` → `"video"`

## Phase 2 — VideoElement Addition

3. Add `getNaturalSize(): { w: number; h: number }` to `src/elements/primitives/VideoElement.ts` — returns `video.videoWidth/videoHeight` (safe after `init()` resolves)

## Phase 3 — VideoScene Class

4. Create `src/elements/scenes/VideoScene.ts`:
   - `class VideoScene extends SceneElement`; `readonly type = "video" as const`
   - Constructor: `payload: VideoScenePayload`, calls `resolveVideoConfig()`, stores as `this.config`
   - `init()`:
     1. Create `VideoElement({ videoUrl: this.config.videoUrl, muted, loopCount })` and `addChild` it
     2. `await super.init()` — this triggers `VideoElement.init()` which awaits metadata
     3. Read `{ w: natW, h: natH }` from `videoElement.getNaturalSize()`
     4. Map `config.sizeMode` → `ImageScaleStrategy`, call `calculateImageScale()` from `src/utils/dimensions.ts` with `configWidth/configHeight/natW/natH`
     5. Compute `renderW = natW * scaleX`, `renderH = natH * scaleY`
     6. Compute `(x, y)` from `config.position` using `renderW/renderH/this.W/this.H` and `positionCorner()` from `src/utils/positioning.ts`
     7. Call `videoElement.setX/setY/setWidth/setHeight`
   - `play()`: attach `FadeInOutBehavior` with `fadeMode: "absolute"` and `fadeDurationMs` from config (if set)
   - `updateSelf`: `if (videoElement.getState() === "FINISHED") this.finish()`
   - `finish()`: null ref

5. Delete `src/elements/scenes/BrainrotScene.ts`

## Phase 4 — Registration & Exports

6. `src/elements/scenes/index.ts`: swap export — `BrainrotScene` → `VideoScene` from `./VideoScene`
7. `src/overlay/SceneFactory.ts`: `brainrot` → `video`, `(p) => new Scenes.VideoScene(p as VideoScenePayload)`

## Phase 5 — Dashboard Dropdown (Both DVD & Video)

8. `src/dashboard/DashboardUI.ts`:
   - Add `populateSelect(id: string, options: { value: string; label: string }[])` utility method
   - Call from constructor (or a new `initSelects()`) to populate both `dvdTypeSelect` and `videoSelect` from imported data
   - DVD options from `DVD_OPTIONS` in `dvdOptions.ts` — map `DvdOption.type` → `{ value: type, label: type }` (or a display label if added to `DvdOption`)
   - Video options from `Object.entries(VIDEO_PRESETS)` — map `[key, preset.label]`
   - Add `getSelectedVideoKey(): string` method alongside existing `getSelectedDvdType()`

9. `dashboard.html`:
   - Remove all hardcoded `<option>` tags from `<select id="dvdTypeSelect">` (keep the `<select>` element, populated at runtime)
   - Add new "Video" `<section>` with same structure as the DVD section:
     - "Quick Trigger" sub-label + optional "Random Video" button
     - "Specific Video" sub-label + `<select id="videoSelect">` + `<button id="videoSelectedBtn">Trigger Selected</button>`

10. `src/dashboard/DashboardController.ts`:
    - Remove `brainrotBtn` handler
    - Add `videoSelectedBtn` handler: reads `ui.getSelectedVideoKey()`, dispatches `scene-event` `"video"` with `{ videoKey }` payload

## Relevant Files

- `src/elements/scenes/videoOptions.ts` — new
- `src/elements/scenes/VideoScene.ts` — new
- `src/elements/scenes/BrainrotScene.ts` — deleted
- `src/elements/scenes/index.ts` — swap export
- `src/types/SceneTypes.ts` — rename literal
- `src/overlay/SceneFactory.ts` — key + factory
- `src/elements/primitives/VideoElement.ts` — add `getNaturalSize()`
- `src/dashboard/DashboardUI.ts` — `populateSelect`, `getSelectedVideoKey`
- `src/dashboard/DashboardController.ts` — new handler, remove old handler
- `dashboard.html` — remove hardcoded options, add Video section

## Verification

1. `npm run build` — zero TypeScript errors
2. POST `{ "sceneType": "video", "payload": { "videoKey": "surfers" } }` → plays at bottom-right
3. POST `{ "videoKey": "oiia" }` → bottom-left, 3 loops, no 60s cap
4. Override: `{ "videoKey": "surfers", "position": { "type": "center" } }` → centered
5. Raw: `{ "videoUrl": "/videos/surfers.mp4", "sizeMode": "native" }` → plays at native size
6. `{ "sizeMode": "stretch" }` without width/height → throws with clear message at config resolution
7. DVD dropdown populates dynamically (no hardcoded options in HTML)
8. Video dropdown selects a key → trigger fires correct payload
9. Old `"brainrot"` causes a TypeScript compile error
