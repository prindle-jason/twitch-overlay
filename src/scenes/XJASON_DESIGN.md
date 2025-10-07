# XJason Scene Design

## Overview
The XJason scene creates a 70-second audio-visual experience where xJason.svg images randomly spawn across the screen with jitter, opacity, and blur behaviors while heavyrain-jason.mp3 plays.

## Scene Requirements
- **Duration**: Around 70 seconds (length of audio file)
- **Audio**: Play heavyrain-jason.mp3 once at scene start
- **Image Spawning**: Typically 2-3 xJason.svg images on screen simultaneously
- **Spawn Rate**: ~1 image per second (configurable range)
- **Image Duration**: Random duration per image (configurable range)
- **No Concurrency**: Single scene instance, queue additional redeems
- **Positioning**: Images fully contained within screen bounds

## Entity Architecture

### ImageEntity (Generic Reusable)
```typescript
class ImageEntity extends RenderableEntity {
  constructor(imagePath: string)
  // Loads image via AssetManager
  // Renders image with applied behaviors
}
```

### XJason-Specific Entity Creation
```typescript
// Scene creates configured entities
const xjasonImage = new ImageEntity('xJason.svg');
xjasonImage.setPosition(randomX, randomY); // Within screen bounds
xjasonImage.setDuration(randomDuration); // 2-3 seconds

// Attach standard XJason behaviors
xjasonImage.addBehavior(new JitterBehavior(2)); // 2px jitter range
xjasonImage.addBehavior(new OpacityFadeBehavior()); // 0 → 1 → 0 over lifetime
xjasonImage.addBehavior(new BlurCycleBehavior()); // 0 → max → 0 over lifetime
```

## Behavior System

### JitterBehavior
- **Purpose**: Vibrate image around starting position
- **Implementation**: Save initial position, apply small random offsets
- **Parameters**: Jitter range (pixels)

### OpacityFadeBehavior  
- **Purpose**: Fade in → full opacity → fade out over entity lifetime
- **Implementation**: Calculate opacity based on entity progression (0-1)
- **Curve**: Smooth fade transition (possibly sine wave)

### BlurCycleBehavior
- **Purpose**: Blur effect that cycles over entity lifetime
- **Implementation**: Apply canvas filter or custom blur rendering
- **Curve**: 0 blur → maximum blur → 0 blur over progression

## System Architecture

### XJasonSystem
```typescript
class XJasonSystem {
  // Spawn timer management
  private spawnTimer: number
  private spawnInterval: [min, max] // Configurable range
  
  // Image lifecycle
  process(deltaTime: number) {
    // Update spawn timer
    // Create new images when timer expires
    // Clean up finished images
  }
  
  // Image creation
  createXJasonImage() {
    // Random position (within screen bounds)
    // Random duration 
    // Attach behaviors
    // Add to scene entities
  }
}
```

### AudioSystem Integration
```typescript
class AudioSystem {
  playSound(soundPath: string, volume?: number) {
    // One-shot audio playback
    // No looping for XJason effect
  }
}
```

## Scene Implementation

### XJasonScene
```typescript
class XJasonScene extends Scene {
  private xjasonSystem = new XJasonSystem()
  private audioSystem = new AudioSystem()
  private sceneDuration = 70000 // 70 seconds
  
  addXJason(payload: XJasonRedeemPayload) {
    this.startScene()
  }
  
  private startScene() {
    // Start audio immediately
    this.audioSystem.playSound('heavyrain-jason.mp3')
    
    // Begin image spawning
    this.xjasonSystem.startSpawning()
  }
  
  update(deltaTime: number) {
    super.update(deltaTime) // UpdateSystem
    this.xjasonSystem.process(deltaTime) // Image spawning/cleanup
  }
  
  isFinished(): boolean {
    // Scene ends when duration reached AND all images finished
    return this.elapsedTime >= this.sceneDuration && 
           this.entities.length === 0
  }
}
```

## Configuration Parameters

### Spawn Configuration
```typescript
interface XJasonConfig {
  spawnInterval: [number, number]    // [500, 900] ms between spawns
  imageDuration: [number, number]    // [1200, 1600] ms per image
  imageScale: number                
  jitterRange: number                // 6 pixels
  screenPadding: number              // 12 pixels to avoid jitter taking images off screen
}
```

### Behavior Parameters
- **Jitter Range**: 6 pixels (adjustable)
- **Opacity Curve**: Smooth fade in/out over lifetime
- **Blur Intensity**: TBD (depends on Canvas filter capabilities)

## Asset Requirements

### Images
- **xJason.svg**: Primary image asset
- **Size**: Original size or configurable scale

### Audio  
- **heavyrain-jason.mp3**: 70-second audio track
- **Format**: Web-compatible audio format
- **Volume**: Configurable scene volume

## SceneManager Integration

### Payload Handling
```typescript
interface XJasonRedeemPayload {
  type: 'xJason'
  user: string
  // No additional configuration needed
}
```

### Scene Lifecycle
```typescript
// SceneManager handles queuing
if (activeScenes.has('xjason')) {
  queueRedeem('xjason', payload) // Queue for later
} else {
  createXJasonScene(payload) // Start immediately
}
```

## Performance Considerations

### Entity Management
- **Automatic cleanup**: Images self-dispose after duration
- **Behavior efficiency**: Simple math operations for jitter/fade

### Asset Loading
- **Image caching**: AssetManager prevents duplicate loads
- **Audio preloading**: Load audio before scene starts
- **Memory cleanup**: Release references when scene ends

## Validation Points

### Does the Design Support Our Architecture?
✅ **Generic ImageEntity**: Reusable across scenes  
✅ **Behavior System**: Composable, attachable behaviors  
✅ **Scene Isolation**: No cross-scene dependencies  
✅ **System Coordination**: XJasonSystem + AudioSystem work together  
✅ **Asset Management**: Images and audio loaded efficiently  
✅ **SceneManager Integration**: Clean payload handling and queuing  

### Potential Issues
⚠️ **Canvas Blur Effects**: Need to verify blur behavior implementation  
⚠️ **Screen Boundary Logic**: Ensure images stay fully visible  
⚠️ **Behavior Timing**: Coordinate behavior curves with entity progression  

## Future Enhancements

### Visual Improvements
- **Variable image sizes**: Random scale factors
- **Rotation effects**: Spinning or tilting images  
- **Color variations**: Tint or hue shifting
- **Particle trails**: Leave visual traces

### Audio Enhancements
- **Volume fading**: Fade in/out scene audio
- **Positional audio**: Images could trigger spatial sounds
- **Multiple audio tracks**: Random audio variation

### Configuration
- **Runtime adjustment**: Tweak parameters without code changes
- **User preferences**: Custom spawn rates or effects
- **A/B testing**: Different behavior combinations