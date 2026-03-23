# Ticker Scene Design - Dynamic Background & Animations

## Goal

Replace static pre-rendered ticker background with dynamically generated components featuring sliding animations and visual interest.

## Visual Components

### Header ("BREAKING NEWS")

- Pink box with white text
- Positioned upper-left above body bar
- Slides in from left, slides out to left

### Body (Lower-third bar)

- **Background Layer**: Taller box creating top/bottom border effect
- **Foreground Layer**: Main white/light bar for text
- Multiple thin decorative boxes scrolling horizontally across body
- Slides in from bottom, slides out to bottom

### Scrolling Text

- Text + emotes displayed on top of body bar
- Scrolls right-to-left across screen
- Existing behavior, unchanged

## Animation Phases

1. **Slide In** (eased animations)
   - Header slides from left → final position
   - Body slides from bottom → final position
   - Decorative boxes begin scrolling

2. **Text Scroll** (after elements in position)
   - Text scrolls across body bar (existing linear motion)
   - Decorative boxes continue scrolling

3. **Slide Out** (reversed slide-in animations)
   - Text completes scroll
   - Header slides left out of view
   - Body slides down out of view

## Technical Notes

- Use `BoxElement` for all background components
- Use `TranslateBehavior` with easing curves for slide animations
- Scrolling decorative boxes: continuous loop or timed sequence
- Remove static `breakingNews.png` dependency
- State machine handles phase transitions

## Implementation Status (Phase 1)

- Dynamic layout is in place: header and body built with BoxElements; static image removed.
- Composite element added: see [src/elements/composites/TickerBodyElement.ts](src/elements/composites/TickerBodyElement.ts). It owns body defaults (height 100, border 10, colors) and decorative strip spawning.
- Message grid builder centralized in [src/utils/chat/buildMessageGrid.ts](src/utils/chat/buildMessageGrid.ts). Random color helper in [src/utils/colors.ts](src/utils/colors.ts).
- Scene orchestration currently lives in [src/elements/scenes/NewTickerScene.ts](src/elements/scenes/NewTickerScene.ts).
- Header/body slide-in and slide-out are implemented, message scroll is implemented, and decorative strips now spawn and move.
- Tunables: scene passes canvas width and body Y only; defaults are in `TickerBodyElement` for quick tuning.

## Remaining Work

### Phase 2: Tuning Pass

- Tune timings (slide in/out duration, text scroll speed).
- Tune layout values (header size/padding, body offsets, text lane positioning).
- Tune decorative strip behavior (spawn interval, size ranges, color strategy).
- Validate readability with real chat payloads (long text, multiple emotes).

### Phase 3: Hardening

- Verify scene lifecycle behavior under rapid retriggers.
- Confirm no visual popping at phase transitions.
- Confirm cleanup behavior and element lifetimes under stress.

### Final Step: Scene Replacement

- Replace [src/elements/scenes/TickerScene.ts](src/elements/scenes/TickerScene.ts) with the finalized implementation from [src/elements/scenes/NewTickerScene.ts](src/elements/scenes/NewTickerScene.ts).
- Keep `scenes/index.ts` export aligned so `ticker` resolves to the finalized `TickerScene` source file.
