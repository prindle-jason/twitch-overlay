# Scene Architecture

## Overview
Scenes provide complete isolation for different effect types. Each scene contains its own entity hierarchy and systems, ensuring no cross-scene interactions while allowing multiple effects to run simultaneously.

## Core Principles
- **Complete Isolation**: No entity can interact across scene boundaries
- **Self-Contained Systems**: Each scene has its own update, render, and specialized systems
- **Independent Lifecycle**: Scenes can be created, paused, resumed, and destroyed independently
- **Performance Optimization**: Small entity counts per scene for optimal processing

## Scene Hierarchy

### Base Scene Class
```typescript
abstract class Scene {
  protected entities: Entity[] = [];
  protected updateSystem = new UpdateSystem();
  protected renderSystem = new RenderSystem();
  protected finished: boolean = false;
  
  // Core lifecycle methods
  update(deltaTime: number): void {
    this.updateSystem.process(this.entities, deltaTime);
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    this.renderSystem.process(this.entities, ctx);
  }
  
  isFinished(): boolean {
    return this.entities.every(e => e.state === EntityState.FINISHED);
  }
  
  // Scene control - delegate to systems
  pause(): void {
    this.updateSystem.pauseEntities(this.entities);
  }
  
  resume(): void {
    this.updateSystem.resumeEntities(this.entities);
  }
  
  destroy(): void {
    // Properly dispose of all entities
    this.updateSystem.destroyEntities(this.entities);
    this.entities = [];
    this.finished = true;
  }
}
```

### Concrete Scene Implementations

#### DvdBounceScene
```typescript
class DvdBounceScene extends Scene {
  private dvdSystem = new DvdBounceSystem();
  
  constructor() {
    super();
    // Scene starts empty, entities added via addDvd()
  }
  
  // Handle DVD redeem messages
  addDvd(payload: DvdRedeemPayload): void {
    const dvdEntity = this.dvdSystem.createDvdEntity(
      payload.imagePath || 'dvd-logo.png',
      Math.random() * 1920,  // Random start position
      Math.random() * 1080,
      150 + Math.random() * 100,  // Random velocity
      120 + Math.random() * 80,
      10000  // 10 second duration
    );
    
    this.entities.push(dvdEntity);
  }
  
  update(deltaTime: number): void {
    // Call base update for core entity processing
    super.update(deltaTime);
    
    // DVD-specific behavior
    this.dvdSystem.process(deltaTime);
  }
  
  // Scene is finished when no DVD entities remain
  isFinished(): boolean {
    return this.entities.length === 0;
  }
}
```

#### ZeldaChestScene
```typescript
class ZeldaChestScene extends Scene {
  private chestSystem = new ZeldaChestSystem();
  private confettiSystem = new ConfettiSystem();
  
  constructor() {
    super();
    // Scene starts empty, chests added via addChest()
  }
  
  // Handle chest redeem messages
  addChest(payload: ChestRedeemPayload): void {
    const chestEntity = this.chestSystem.createChestEntity(
      payload.x || 960,
      payload.y || 540,
      payload.chestType || 'basic',
      this.generateRandomLoot(payload.tier)
    );
    
    this.entities.push(chestEntity);
    
    // Auto-start opening after delay
    setTimeout(() => chestEntity.open(), 500);
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    this.chestSystem.process(deltaTime);
    this.confettiSystem.process(deltaTime); // Chest spawns confetti
  }
  
  private generateRandomLoot(tier?: string): ChestContents {
    const lootTypes = tier === 'premium' ? 
      ['gold_rupee', 'diamond', 'master_sword'] : 
      ['rupee', 'heart', 'key', 'bomb'];
    return {
      type: lootTypes[Math.floor(Math.random() * lootTypes.length)],
      amount: Math.floor(Math.random() * 5) + 1
    };
  }
}
```

#### ConfettiScene
```typescript
class ConfettiScene extends Scene {
  private confettiSystem = new ConfettiSystem();
  
  constructor() {
    super();
    // Scene starts empty, particles added via addConfettiBurst()
  }
  
  // Handle confetti redeem messages
  addConfettiBurst(payload: ConfettiRedeemPayload): void {
    const particleCount = payload.intensity === 'high' ? 100 : 50;
    const colors = payload.colors || ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
    
    // Create burst of confetti particles
    for (let i = 0; i < particleCount; i++) {
      const particle = this.confettiSystem.createParticle(
        payload.centerX + (Math.random() - 0.5) * 200,  // Spread
        payload.centerY + (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 400,  // Random velocity X
        -Math.random() * 300 - 100,   // Upward velocity Y
        colors[Math.floor(Math.random() * colors.length)],
        5000  // 5 second lifetime
      );
      
      this.entities.push(particle);
    }
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    this.confettiSystem.process(deltaTime);
  }
}
```

## Message-Driven Architecture

### Payload Types
```typescript
interface DvdRedeemPayload {
  type: 'dvdBounce';
  user: string;
  imagePath?: string;
  tier?: 'basic' | 'premium';
}

interface ChestRedeemPayload {
  type: 'zeldaChest';
  user: string;
  x?: number;
  y?: number;
  chestType?: 'basic' | 'silver' | 'gold';
  tier?: 'basic' | 'premium';
}

interface ConfettiRedeemPayload {
  type: 'confetti';
  user: string;
  centerX: number;
  centerY: number;
  intensity?: 'normal' | 'high';
  colors?: string[];
}

type RedeemPayload = DvdRedeemPayload | ChestRedeemPayload | ConfettiRedeemPayload;
```

### StreamerBot Message Handler
```typescript
class StreamerbotMessageHandler {
  constructor(private sceneManager: SceneManager) {}
  
  // Receives messages from Streamer.bot
  handleMessage(message: StreamerbotMessage): void {
    const payload = this.parseMessage(message);
    if (payload) {
      this.sceneManager.handleRedeemPayload(payload);
    }
  }
  
  private parseMessage(message: StreamerbotMessage): RedeemPayload | null {
    switch (message.event_type) {
      case 'channel_point_redeem':
        return this.parseChannelPointRedeem(message);
      case 'follow':
        return { type: 'confetti', user: message.user, centerX: 960, centerY: 540 };
      case 'subscription':
        return { type: 'zeldaChest', user: message.user, tier: 'premium' };
      default:
        return null;
    }
  }
  
  private parseChannelPointRedeem(message: StreamerbotMessage): RedeemPayload | null {
    switch (message.reward_title) {
      case 'DVD Bounce Logo':
        return { type: 'dvdBounce', user: message.user };
      case 'Zelda Chest':
        return { type: 'zeldaChest', user: message.user };
      case 'Confetti Celebration':
        return { type: 'confetti', user: message.user, centerX: 960, centerY: 540 };
      default:
        return null;
    }
  }
}
```

## SceneManager Coordination

```typescript
class SceneManager {
  private activeScenes = new Map<string, Scene>();
  
  // Handle incoming redeem payloads
  handleRedeemPayload(payload: RedeemPayload): void {
    switch (payload.type) {
      case 'dvdBounce':
        this.handleDvdRedeem(payload);
        break;
      case 'zeldaChest':
        this.handleChestRedeem(payload);
        break;
      case 'confetti':
        this.handleConfettiRedeem(payload);
        break;
    }
  }
  
  private handleDvdRedeem(payload: DvdRedeemPayload): void {
    let dvdScene = this.activeScenes.get('dvd') as DvdBounceScene;
    
    if (!dvdScene) {
      // Create new DVD scene if none exists
      dvdScene = new DvdBounceScene();
      this.activeScenes.set('dvd', dvdScene);
    }
    
    // Add DVD to existing or new scene
    dvdScene.addDvd(payload);
  }
  
  private handleChestRedeem(payload: ChestRedeemPayload): void {
    let chestScene = this.activeScenes.get('chest') as ZeldaChestScene;
    
    if (!chestScene) {
      chestScene = new ZeldaChestScene();
      this.activeScenes.set('chest', chestScene);
    }
    
    chestScene.addChest(payload);
  }
  
  private handleConfettiRedeem(payload: ConfettiRedeemPayload): void {
    let confettiScene = this.activeScenes.get('confetti') as ConfettiScene;
    
    if (!confettiScene) {
      confettiScene = new ConfettiScene();
      this.activeScenes.set('confetti', confettiScene);
    }
    
    confettiScene.addConfettiBurst(payload);
  }
  
  // Main game loop
  frame(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, 1920, 1080);
    
    // Update all active scenes
    this.activeScenes.forEach(scene => {
      scene.update(deltaTime);
    });
    
    // Render all active scenes (overlapping)
    this.activeScenes.forEach(scene => {
      scene.render(ctx);
    });
    
    // Remove finished scenes
    const finishedScenes: string[] = [];
    this.activeScenes.forEach((scene, key) => {
      if (scene.isFinished()) {
        finishedScenes.push(key);
      }
    });
    
    finishedScenes.forEach(key => {
      this.activeScenes.delete(key);
    });
  }
  
  // Scene management utilities
  getActiveSceneTypes(): string[] {
    return Array.from(this.activeScenes.keys());
  }
  
  getSceneEntityCount(sceneType: string): number {
    const scene = this.activeScenes.get(sceneType);
    return scene ? scene.entities.length : 0;
  }
  
  clearScene(sceneType: string): void {
    const scene = this.activeScenes.get(sceneType);
    if (scene) {
      scene.destroy();
      this.activeScenes.delete(sceneType);
    }
  }
}
```

## System Integration Within Scenes

### Core Systems (Every Scene)
- **UpdateSystem**: Entity lifecycle and state management
- **RenderSystem**: Canvas rendering with transform hierarchy

### Specialized Systems (Scene-Specific)
- **DvdBounceSystem**: Velocity-based movement with screen edge collision
- **ZeldaChestSystem**: Chest opening animations and loot spawning
- **ConfettiSystem**: Particle physics with gravity and fade-out
- **SsbmSystem**: SSBM-specific animations and sound effects

### System Processing Order
```typescript
// Base Scene handles core processing
update(deltaTime: number): void {
  // 1. Core entity updates (lifecycle, state transitions)
  this.updateSystem.process(this.entities, deltaTime);
  
  // 2. Specialized scenes override to add their systems:
  //    super.update(deltaTime);
  //    this.dvdSystem.process(deltaTime);
  //    this.confettiSystem.process(deltaTime);
  
  // 3. Rendering happens in SceneManager.frame()
}
```

### UpdateSystem Extended Responsibilities
```typescript
class UpdateSystem {
  process(entities: Entity[], deltaTime: number): void {
    // Standard entity lifecycle processing
  }
  
  // Scene control methods
  pauseEntities(entities: Entity[]): void {
    entities.forEach(e => {
      if (e.state === EntityState.PLAYING) {
        e.setState(EntityState.PAUSED);
      }
    });
  }
  
  resumeEntities(entities: Entity[]): void {
    entities.forEach(e => {
      if (e.state === EntityState.PAUSED) {
        e.setState(EntityState.PLAYING);
      }
    });
  }
  
  destroyEntities(entities: Entity[]): void {
    entities.forEach(e => {
      e.setState(EntityState.FINISHED);
      e.dispose(); // Cleanup resources, event listeners, etc.
    });
  }
}

## Scene Lifecycle

### Creation Flow
```
Streamer.bot Message → StreamerbotMessageHandler → Payload Parsing → 
SceneManager.handleRedeemPayload() → Scene Created (if needed) → 
Entity Added to Scene → Scene Processing Continues
```

### Message Flow
```
StreamerbotMessageHandler.handleMessage() → parseMessage() → 
SceneManager.handleRedeemPayload() → Scene.addEntity() → 
System.createEntity() → Entity Added to Scene
```

### Scene Reuse Flow
```
DVD Redeem #1 → Create DvdBounceScene → Add DVD Entity #1
DVD Redeem #2 → Reuse DvdBounceScene → Add DVD Entity #2
DVD Redeem #3 → Reuse DvdBounceScene → Add DVD Entity #3
...All DVDs finish → DvdBounceScene.isFinished() → Scene Removed
```

### Cleanup Flow
```
Entity Lifecycle Completes → Entity Removed from Scene → 
Scene.isFinished() Checks → SceneManager Removes Empty Scenes → 
Scene Garbage Collected
```

## Performance Benefits

### Isolation Advantages
- **No Cross-Scene Collision Detection**: DVD logos never collide with chests
- **Small Entity Counts**: Each scene processes 1-50 entities, not thousands
- **Targeted Optimizations**: Confetti scenes can use object pooling, DVD scenes can skip complex physics
- **Independent Memory Management**: Scenes can be garbage collected independently

### System Efficiency
```typescript
// Instead of one system checking all entities:
allEntities.forEach(entity => {
  if (entity instanceof DvdBounceEntity) { // Type check overhead
    // Process DVD logic
  }
  if (entity instanceof ConfettiParticle) { // More type checks
    // Process confetti logic
  }
});

// Each scene only processes relevant entities:
dvdScene.update() // Only DVD entities, no type checking
confettiScene.update() // Only particles, no type checking
```

## Real-World Scene Examples

### Multiple DVD Redeems
```typescript
// Timeline of events:
// T=0s: User1 redeems DVD → Create DvdBounceScene, add DVD #1
// T=2s: User2 redeems DVD → Reuse DvdBounceScene, add DVD #2  
// T=5s: User3 redeems DVD → Reuse DvdBounceScene, add DVD #3
// T=10s: DVD #1 expires → Remove from scene
// T=12s: DVD #2 expires → Remove from scene
// T=15s: DVD #3 expires → Remove from scene, DvdBounceScene.isFinished() = true
// T=15s: SceneManager removes DvdBounceScene

// Result: All DVDs bounce simultaneously in one scene
const dvdScene = sceneManager.activeScenes.get('dvd');
console.log(dvdScene.entities.length); // Could be 1, 2, 3, etc. DVDs
```

### Mixed Effect Combinations
```typescript
// Complex timeline:
// T=0s: DVD redeem → DvdBounceScene created with 1 DVD
// T=1s: Confetti redeem → ConfettiScene created with 50 particles
// T=2s: Chest redeem → ZeldaChestScene created with 1 chest
// T=3s: Another DVD redeem → DvdBounceScene gets 2nd DVD
// T=4s: Another confetti redeem → ConfettiScene gets 100 more particles

// All scenes run simultaneously:
// - 2 DVDs bouncing around
// - 150 confetti particles falling
// - 1 chest opening and glowing
// - No interactions between scenes
```

### Scene-Specific Behavior
```typescript
// DVD Scene: Accumulates bouncing logos
class DvdBounceScene extends Scene {
  addDvd(payload: DvdRedeemPayload): void {
    // Each new DVD has random properties
    const dvd = this.dvdSystem.createDvdEntity(/*...*/);
    this.entities.push(dvd);
    
    // Could log for stream overlay
    console.log(`${payload.user} added DVD! Total: ${this.entities.length}`);
  }
}

// Confetti Scene: Supports burst accumulation
class ConfettiScene extends Scene {
  addConfettiBurst(payload: ConfettiRedeemPayload): void {
    // Add more particles to existing scene
    for (let i = 0; i < 50; i++) {
      const particle = this.confettiSystem.createParticle(/*...*/);
      this.entities.push(particle);
    }
    
    // Could trigger sound effect for each burst
    this.playSound('party-horn.mp3');
  }
}
```

## Future Extensions

### Scene Transitions
- **Fade In/Out**: Scenes can animate their opacity
- **Slide Transitions**: Scenes can animate their position
- **Composite Effects**: One scene can spawn another scene

### Scene Communication
- **Event Broadcasting**: Scenes can emit events for SceneManager to handle
- **Scene Layers**: Background, midground, foreground scene layers
- **Global Effects**: Screen-wide effects that span multiple scenes

### Advanced Features
- **Scene Pooling**: Reuse scene instances for better performance
- **Scene Serialization**: Save/load scene state for debugging
- **Scene Templates**: Predefined scene configurations
- **Dynamic Scene Loading**: Load scene definitions from JSON files