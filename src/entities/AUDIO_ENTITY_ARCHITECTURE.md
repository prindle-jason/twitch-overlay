# AudioEntity Architecture

## Overview
AudioEntity provides entity-based audio playback that integrates with the entity system lifecycle. Audio is managed as entities rather than through a separate system, providing consistent behavior management and cleanup.

## Core Responsibilities
- **Audio Playback**: Play audio files with entity lifecycle management
- **Volume Control**: Per-entity volume with scene-level control
- **Asset Integration**: Work with AssetManager for audio loading
- **Entity Lifecycle**: Proper initialization, update, and disposal
- **Behavior Support**: Allow audio behaviors and child entities

## Design Principles
- **Entity-First**: Audio uses entity system rather than separate audio system
- **Consistent Architecture**: Same patterns as visual entities
- **Self-Contained**: Each AudioEntity manages its own playback
- **Behavior Composable**: Audio can have behaviors for complex effects
- **Child Support**: Visual entities can sync to audio timing

## Core Implementation

### Basic AudioEntity
```typescript
interface AudioEntityConfig {
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
  fadeIn?: number; // seconds
}

class AudioEntity extends Entity {
  private audio: HTMLAudioElement | null = null;
  private audioPath: string;
  private config: AudioEntityConfig;
  
  constructor(audioPath: string, config: AudioEntityConfig = {}) {
    super();
    this.audioPath = audioPath;
    this.config = { 
      volume: 1.0, 
      loop: false, 
      autoPlay: false, 
      ...config 
    };
  }
  
  async initialize(): Promise<void> {
    this.audio = await AssetManager.getAudio(this.audioPath);
    this.audio.volume = this.config.volume;
    this.audio.loop = this.config.loop;
    
    if (this.config.autoPlay) {
      this.playAudio();
    }
  }
  
  playAudio(): void {
    if (this.audio && !this.audio.ended) {
      this.audio.play().catch(e => 
        console.warn(`Audio play failed: ${this.audioPath}`, e)
      );
    }
  }
  
  stopAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
  
  shouldFinish(): boolean {
    // Auto-finish when audio ends (unless looping)
    return !this.config.loop && (this.audio?.ended ?? false);
  }
  
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.config.volume;
    }
  }
  
  dispose(): void {
    this.stopAudio();
    this.audio = null;
    super.dispose();
  }
}
```

### Usage Patterns

#### Simple Fire-and-Forget Audio
```typescript
class XJasonScene extends Scene {
  private onImageSpawn(): void {
    // Quick sound effect - creates entity, plays, auto-finishes
    const spawnSound = new AudioEntity('spawn-sound.mp3', { 
      volume: 0.5,
      autoPlay: true 
    });
    this.entityManager.addEntity(spawnSound);
    // Entity will auto-remove when audio ends
  }
}
```

#### Background Audio with Lifecycle
```typescript
class XJasonScene extends Scene {
  constructor() {
    super();
    
    // Long-running background audio
    const bgAudio = new AudioEntity('heavyrain-jason.mp3', { 
      volume: 0.8,
      autoPlay: true 
    });
    this.entityManager.addEntity(bgAudio);
    // Audio runs for full scene duration, auto-finishes when done
  }
}
```

#### Complex Audio with Behaviors
```typescript
class ZeldaChestScene extends Scene {
  addChest(payload: ChestRedeemPayload): void {
    // Audio with complex timing
    const chestAudio = new AudioEntity('zelda-open-chest.mp3');
    
    // Add behavior for delayed start
    const delayBehavior = new DelayBehavior(1.0); // 1 second delay
    chestAudio.addBehavior(delayBehavior);
    
    // Add behavior for volume fade
    const fadeInBehavior = new FadeInAudioBehavior(2.0);
    chestAudio.addBehavior(fadeInBehavior);
    
    this.entityManager.addEntity(chestAudio);
  }
}
```

## AssetManager Integration

### Audio Loading with HTMLAudioElement
```typescript
class AssetManager {
  private audioCache = new Map<string, HTMLAudioElement>();
  
  async getAudio(path: string): Promise<HTMLAudioElement> {
    if (this.audioCache.has(path)) {
      // Clone audio element for multiple simultaneous playback
      const cached = this.audioCache.get(path)!;
      return cached.cloneNode() as HTMLAudioElement;
    }
    
    const audio = new Audio(path);
    
    // Wait for audio to be ready
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
    });
    
    this.audioCache.set(path, audio);
    return audio.cloneNode() as HTMLAudioElement;
  }
}
```

### Preloading Audio
```typescript
class AssetManager {
  async preloadAudio(paths: string[]): Promise<void> {
    const loadPromises = paths.map(path => this.getAudio(path));
    await Promise.all(loadPromises);
    console.log(`Preloaded ${paths.length} audio files`);
  }
}

// Usage in scene initialization
class XJasonScene extends Scene {
  async initialize(): Promise<void> {
    await AssetManager.preloadAudio([
      'heavyrain-jason.mp3',
      'spawn-sound.mp3'
    ]);
  }
}
```

## Entity System Integration

### Child Entities for Visual Sync
```typescript
class AudioVisualizerEntity extends TransformEntity {
  constructor(private audioEntity: AudioEntity) {
    super();
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Sync visual effects to audio timing
    if (this.audioEntity.audio) {
      const currentTime = this.audioEntity.audio.currentTime;
      const duration = this.audioEntity.audio.duration;
      
      // Update visualization based on audio progress
      this.updateVisualization(currentTime, duration);
    }
  }
}

// Usage
const bgAudio = new AudioEntity('background-music.mp3', { autoPlay: true });
const visualizer = new AudioVisualizerEntity(bgAudio);
bgAudio.addChild(visualizer); // Visualizer follows audio lifecycle
```

### Audio-Driven Behaviors
```typescript
class FadeInAudioBehavior extends Behavior {
  private fadeTime: number;
  private startVolume: number;
  private targetVolume: number;
  
  constructor(fadeTime: number) {
    super();
    this.fadeTime = fadeTime;
  }
  
  onAttach(entity: AudioEntity): void {
    this.startVolume = 0;
    this.targetVolume = entity.config.volume;
    entity.setVolume(0);
    entity.playAudio();
  }
  
  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.fadeTime, 1.0);
    
    const currentVolume = this.startVolume + 
      (this.targetVolume - this.startVolume) * progress;
    
    (this.entity as AudioEntity).setVolume(currentVolume);
  }
  
  shouldFinish(): boolean {
    return this.elapsed >= this.fadeTime;
  }
}
```

## Scene Integration Patterns

### Scene-Level Audio Control
```typescript
class Scene {
  private sceneVolume: number = 1.0;
  
  setSceneVolume(volume: number): void {
    this.sceneVolume = Math.max(0, Math.min(1, volume));
    
    // Update all audio entities in scene
    this.entityManager.getEntitiesByType(AudioEntity).forEach(audio => {
      audio.applySceneVolume(this.sceneVolume);
    });
  }
}

class AudioEntity extends Entity {
  private baseVolume: number;
  private sceneVolumeMultiplier: number = 1.0;
  
  applySceneVolume(sceneVolume: number): void {
    this.sceneVolumeMultiplier = sceneVolume;
    this.updateActualVolume();
  }
  
  setVolume(volume: number): void {
    this.baseVolume = volume;
    this.updateActualVolume();
  }
  
  private updateActualVolume(): void {
    if (this.audio) {
      this.audio.volume = this.baseVolume * this.sceneVolumeMultiplier;
    }
  }
}
```

### Multiple Audio Entities
```typescript
class ConfettiScene extends Scene {
  addConfettiBurst(payload: ConfettiRedeemPayload): void {
    // Each burst gets its own audio entity
    const burstSound = new AudioEntity('party-horn.mp3', { 
      volume: 0.7,
      autoPlay: true 
    });
    this.entityManager.addEntity(burstSound);
    
    // Create visual confetti
    const confetti = this.createConfettiParticles();
    // ... particle creation
  }
}
```

## Audio File Requirements

### Supported Formats
- **MP3**: Universal browser support, good compression
- **OGG**: Open source, good quality
- **WAV**: Uncompressed, larger files but reliable
- **M4A**: Good quality, Apple ecosystem optimized

### File Organization
```
resources/
  audio/
    heavyrain-jason.mp3    # XJason scene background
    spawn-sound.mp3        # Quick effect sounds
    party-horn.mp3         # Confetti burst sound
    zelda-open-chest.mp3   # Chest opening sound
    zelda-get-item.mp3     # Item acquisition sound
```

### Audio Specifications
- **Sample Rate**: 44.1kHz standard, 48kHz for high quality
- **Bit Depth**: 16-bit minimum, 24-bit for source material
- **Duration**: Varies by use case
  - Effects: < 3 seconds for responsiveness
  - Background: 30-120 seconds for loops
- **Volume**: Normalize all files to consistent levels

## Performance Considerations

### Memory Management
```typescript
class AudioEntity extends Entity {
  dispose(): void {
    // Clean up audio resources
    if (this.audio) {
      this.audio.pause();
      this.audio.src = ''; // Release audio data
      this.audio = null;
    }
    super.dispose();
  }
}
```

### Browser Compatibility
```typescript
class AudioEntity extends Entity {
  async initialize(): Promise<void> {
    try {
      this.audio = await AssetManager.getAudio(this.audioPath);
      
      // Handle browser autoplay policies
      if (this.config.autoPlay) {
        this.playAudio();
      }
    } catch (error) {
      console.warn(`Audio initialization failed: ${this.audioPath}`, error);
      // Entity can still exist without audio
    }
  }
  
  playAudio(): void {
    if (!this.audio) return;
    
    const playPromise = this.audio.play();
    if (playPromise) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError') {
          console.warn('Audio autoplay blocked, waiting for user interaction');
        } else {
          console.error('Audio playback failed:', error);
        }
      });
    }
  }
}
```

### User Interaction Requirements
```typescript
class AudioManager {
  private static audioUnlocked: boolean = false;
  
  static async unlockAudio(): Promise<void> {
    if (AudioManager.audioUnlocked) return;
    
    // Play silent audio to unlock on user interaction
    const audio = new Audio();
    audio.volume = 0;
    try {
      await audio.play();
      AudioManager.audioUnlocked = true;
      console.log('Audio unlocked');
    } catch (error) {
      console.warn('Audio unlock failed:', error);
    }
  }
}

// Call on first user interaction (click, keypress, etc.)
document.addEventListener('click', () => {
  AudioManager.unlockAudio();
}, { once: true });
```

## Advanced Features

### Synchronized Audio Groups
```typescript
class AudioGroup {
  private audioEntities: AudioEntity[] = [];
  
  addAudio(audioEntity: AudioEntity): void {
    this.audioEntities.push(audioEntity);
  }
  
  playAll(): void {
    // Attempt to start all audio simultaneously
    this.audioEntities.forEach(audio => audio.playAudio());
  }
  
  stopAll(): void {
    this.audioEntities.forEach(audio => audio.stopAudio());
  }
  
  setGroupVolume(volume: number): void {
    this.audioEntities.forEach(audio => audio.setVolume(volume));
  }
}
```

### Audio-Triggered Events
```typescript
class AudioEntity extends Entity {
  private timeMarkers: Map<number, () => void> = new Map();
  
  addTimeMarker(time: number, callback: () => void): void {
    this.timeMarkers.set(time, callback);
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (this.audio && !this.audio.paused) {
      const currentTime = this.audio.currentTime;
      
      // Check for time markers
      this.timeMarkers.forEach((callback, time) => {
        if (currentTime >= time) {
          callback();
          this.timeMarkers.delete(time); // Fire once
        }
      });
    }
  }
}

// Usage: Sync visual effects to audio timing
const bgAudio = new AudioEntity('music.mp3', { autoPlay: true });
bgAudio.addTimeMarker(15.0, () => {
  // Spawn special effect at 15 seconds
  this.spawnSpecialEffect();
});
```

## Integration Example

### Complete Scene with Audio
```typescript
class XJasonScene extends Scene {
  constructor() {
    super();
    this.setupAudio();
  }
  
  private setupAudio(): void {
    // Background audio for full scene
    const bgAudio = new AudioEntity('heavyrain-jason.mp3', { 
      volume: 0.8,
      autoPlay: true 
    });
    
    // Add fade-in behavior
    const fadeIn = new FadeInAudioBehavior(2.0);
    bgAudio.addBehavior(fadeIn);
    
    this.entityManager.addEntity(bgAudio);
  }
  
  private spawnImageWithSound(): void {
    // Quick sound effect for each image spawn
    const spawnSound = new AudioEntity('spawn-sound.mp3', { 
      volume: 0.5,
      autoPlay: true 
    });
    this.entityManager.addEntity(spawnSound);
    
    // Create image entity
    const image = new ImageEntity('xJason.svg');
    this.entityManager.addEntity(image);
  }
}
```

This AudioEntity design provides consistent entity-based audio management that integrates naturally with the entity system architecture while supporting both simple and complex audio use cases.