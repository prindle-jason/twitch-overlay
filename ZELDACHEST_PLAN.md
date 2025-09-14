# ZeldaChestEffect Implementation Guide

## Overview
Create a Zelda-inspired treasure chest effect with layered visuals, audio synchronization, particle physics, and dynamic behavior management. The effect features a chest that fades in, opens with a fanfare, emits particles, and fades out.

## Required Assets
- `zeldaChestLidClosed.png` - Closed chest lid (back layer)
- `zeldaChestLidOpen.png` - Open chest lid (back layer)  
- `zeldaChestFront.png` - Chest front/body (front layer)
- `zeldaFanfare.mp3` - 5-second Zelda item acquisition sound
- `rupeeGreen.png`, `rupeeBlue.png`, `rupeeRed.png`, `rupeeGold.png` - Particle sprites
- `korok.png` - Rare particle sprite (optional)

## Effect Lifecycle
1. **Chest Fade In** → **Fanfare Plays** → **Chest Opens + Flash** → **Particles Spawn** → **Chest Fades Out** → **Effect Ends**

## Layer Structure (Z-order)
Advanced layering for realistic depth perception based on particle movement:

```javascript
draw(ctx) {
  // Layer 1: Chest lid (back)
  this.chestLid.draw(ctx);
  
  // Layer 2: Rising particles (behind chest front - emerging from inside)
  this.particles
    .filter(p => p.velocityY < 0) // Moving upward
    .forEach(p => p.draw(ctx));
  
  // Layer 3: Chest front + glow (middle)
  this.chestFront.draw(ctx);
  this.chestGlow.draw(ctx);
  
  // Layer 4: Falling particles (in front of chest - realistic depth)
  this.particles
    .filter(p => p.velocityY >= 0) // Moving downward/stationary
    .forEach(p => p.draw(ctx));
  
  // Layer 5: Flash effect (top)
  this.flash.draw(ctx);
}
```

This creates the illusion that particles emerge from inside the chest, then fall in front of it as they drop back down.

## Implementation Steps

### Step 1: Create New Behavior Classes
Create these reusable behaviors in `/behaviors/`:

**EaseInBehavior.js**
- Uses `getEaseInProgress()` from progressUtils
- Configurable duration and curve type
- Transitions element from opacity 0→1

**EaseOutBehavior.js** 
- Uses `getEaseOutProgress()` from progressUtils
- Configurable duration and curve type  
- Transitions element from opacity 1→0

**DelayedSoundBehavior.js**
- Plays sound after specified delay
- One-time trigger behavior

**FlashBehavior.js**
- Brief opacity burst effect
- Sine wave pattern for natural flash

**GlowBehavior.js**
- Subtle pulsing/shimmering effect
- For the chest's inner glow

### Step 2: Create ZeldaChestEffect Class
File: `/effects/ZeldaChestEffect.js`

**Constructor Setup:**
- Create all ImageElements (lid, front, glow)
- Create SoundElement for fanfare  
- Create flash effect element
- Initialize ParticleSpawner (inactive initially)
- Add initial EaseInBehaviors to chest elements

**Key Properties:**
```javascript
this.phases = {
  fanfareStart: 1500,
  chestOpen: 5000, 
  particleBurst: 5100,
  particleEnd: 6000
};
this.chestFadeOutStarted = false;
this.particles = [];
```

### Step 3: Implement Custom Draw Method
Override `draw()` to handle layer ordering:
- Don't call `super.draw()`
- Manually draw elements in correct Z-order
- Ensures particles appear behind chest front but above lid

### Step 4: Add Dynamic Behavior Management
In `update()` method:
- **Fanfare Trigger**: Start audio at designated time
- **Chest Opening**: Switch lid sprite, trigger flash and glow
- **Particle System**: Activate spawner, create rupees with physics
- **Fade Out Trigger**: Remove EaseIn behaviors, add EaseOut behaviors when appropriate

### Step 5: Implement Particle System
**Particle Creation:**
- 90% rupees (random colors), 10% korok chance
- Spawn from chest center with upward velocity
- Add FallingBehavior (gravity, drag) and TiltBehavior (spin)

**Particle Cleanup:**
- Remove when off-screen
- Automatic fade-out after time limit

### Step 6: Add Timing & State Management
**Event-Driven Transitions:**
- Audio sync: Fanfare starts at specific time
- Visual sync: Chest opens when fanfare ends
- Cleanup trigger: Fade out when particles finish spawning

**State Tracking:**
- Track behavior transition states
- Early completion detection
- Proper cleanup when effect ends

### Step 7: Integration & Testing
**EffectManager Integration:**
- Add ZeldaChestEffect to available effects
- Test with existing overlay system
- Verify audio/visual synchronization

**Performance Optimization:**
- Efficient particle cleanup
- Proper memory management for dynamic behaviors
- Frame rate impact testing

## Key Technical Considerations

**Behavior System Enhancement:**
- Elements need `removeBehavior()` method
- Behaviors should be easily swappable
- Consider behavior priority/ordering

**Asset Loading:**
- Ensure all sprites load before effect starts
- Handle missing asset gracefully
- Preload audio for seamless playback

**Timing Precision:**
- Use `this.elapsed` for accurate timing
- Consider audio latency compensation
- Smooth transitions between phases

**Physics & Animation:**
- Realistic particle physics (gravity, bounce, drag)
- Smooth easing curves for magical feel
- Subtle secondary animations (settle bounce, glow pulse)

This modular approach allows incremental development and testing of each component while maintaining clean separation of concerns.
