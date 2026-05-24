# DVD Scene Enhancement Status (2026-05-23)

Short-lived progress note for handoff between agents.

## Scope

Target architecture for DVD corner-hit follow-up effects:

- DvdElement owns only its lifecycle and selected corner-hit metadata.
- DvdScene translates DVD completion into internal spawn intent events.
- SceneManager is the only place that instantiates scenes/pool variants.

## Findings Summary

### Completed

- cornerHitEffect model exists with scene, pool, and none kinds.
  - src/elements/composites/dvdOptions.ts
- Default corner hit effect is defined and maps to confetti scene behavior.
  - src/elements/composites/dvdOptions.ts
- DvdElement resolves effect once during option selection and exposes getter.
  - src/elements/composites/DvdElement.ts
- DvdElement still finishes through normal Element lifecycle, preserving element-finished emission.
  - src/elements/primitives/Element.ts

### Implemented Incorrectly (vs desired architecture)

- DvdScene still directly creates and adds follow-up scenes/pool scenes via SceneFactory.
  - src/elements/scenes/DvdScene.ts
- DvdScene currently polls finished DvdElement children during updateSelf instead of using event subscription to element-finished.
  - src/elements/scenes/DvdScene.ts

### Missing

- No internal typed spawn-intent event added to EventTypes.
  - src/types/EventTypes.ts
- No SceneManager subscription to a spawn-intent event route.
  - src/overlay/SceneManager.ts
- No DvdScene event listener that:
  - listens to element-finished,
  - filters to DvdElement instances owned by this DvdScene,
  - checks hasHitCorner,
  - emits spawn intent only for scene/pool,
  - emits nothing for none.

## Risk Notes

- Current direct addChild follow-up behavior makes those spawned effects children of DvdScene rather than top-level SceneManager-managed scenes. This can diverge from centralized scene lifecycle ownership and routing expectations.

## Suggested Next Tasks

1. Add internal spawn-intent typed event(s) in EventTypes and EventDetailMap.
2. Update DvdScene to subscribe/unsubscribe to element-finished and emit spawn-intent; remove direct SceneFactory creation in DvdScene.
3. Update SceneManager constructor/cleanup to subscribe/unsubscribe to spawn-intent and route to existing handleSceneEvent and handlePoolEvent.
4. Manual verification:
   - Default option still yields confetti via new route.
   - none yields no follow-up.
   - explicit scene override routes correctly.
   - explicit pool override routes correctly.
   - no duplicate handling with multiple DVDs / active scenes.

## Update 2026-05-23

- First task is now complete: internal spawn-intent events are added, DvdScene emits them from finished corner-hit DVDs, and SceneManager routes them to the existing scene/pool handlers.
- Next step is focused verification of the four expected behaviors plus duplicate-handling checks.
