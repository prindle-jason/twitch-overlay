# SceneManager Architecture

## Overview
The SceneManager is the central orchestrator for all scene lifecycle management. It determines how to handle incoming commands based on scene types - whether to create new scenes, queue them, or notify existing scenes. Different scene types have different coordination behaviors.

## Scene Coordination Patterns

### Scene Behavior Types
```typescript
enum SceneBehaviorType {
  ALWAYS_NEW = 'always_new',        // DVD: Always create new scene
  QUEUE_IF_ACTIVE = 'queue_active', // xJason: Queue if scene active  
  NOTIFY_EXISTING = 'notify_existing' // New DVD: Notify existing or create new
}

interface SceneConfig {
  sceneType: string;
  behaviorType: SceneBehaviorType;
  //maxConcurrent?: number;           // Max concurrent scenes of this type
  //queueLimit?: number;              // Max queued scenes
  notificationData?: any;           // Data to send to existing scenes
}

// Scene configuration registry
const SCENE_CONFIGS: Map<string, SceneConfig> = new Map([
  ['dvd', {
    sceneType: 'dvd',
    behaviorType: SceneBehaviorType.NOTIFY_EXISTING
  }],
  
  ['xJason', {
    sceneType: 'xJason',
    behaviorType: SceneBehaviorType.QUEUE_IF_ACTIVE
  }],
  
  ['confetti', {
    sceneType: 'confetti',
    behaviorType: SceneBehaviorType.ALWAYS_NEW,
  }],
  
  ['zeldaChest', {
    sceneType: 'zeldaChest',
    behaviorType: SceneBehaviorType.QUEUE_IF_ACTIVE
  }]
]);
```

## SceneManager Implementation

### Core SceneManager Class
```typescript
interface QueuedScene {
  sceneType: string;
  payload: any;
  timestamp: number;
}

class SceneManager {
  private activeScenes: Map<string, Scene[]> = new Map();
  private sceneQueue: QueuedScene[] = [];
  private context: CanvasRenderingContext2D;
  private assetManager: AssetManager;
  private nextSceneId: number = 1;

  constructor(context: CanvasRenderingContext2D, assetManager: AssetManager) {
    this.context = context;
    this.assetManager = assetManager;
  }

  async initialize(): Promise<void> {
    console.log('[SceneManager] Initializing...');
    // Pre-warm any scene factories or resources
  }

  handleCommand(commandName: string, payload: any): void {
    console.log(`[SceneManager] Handling command: ${commandName}`, payload);
    
    const config = SCENE_CONFIGS.get(commandName);
    if (!config) {
      console.warn(`[SceneManager] No configuration for command: ${commandName}`);
      return;
    }

    switch (config.behaviorType) {
      case SceneBehaviorType.ALWAYS_NEW:
        this.handleAlwaysNew(config, payload);
        break;
        
      case SceneBehaviorType.QUEUE_IF_ACTIVE:
        this.handleQueueIfActive(config, payload);
        break;
        
      case SceneBehaviorType.NOTIFY_EXISTING:
        this.handleNotifyExisting(config, payload);
        break;
    }
  }

  update(deltaTime: number): void {
    // Process queued scenes
    this.processQueue();
    
    // Update all active scenes
    for (const [sceneType, scenes] of this.activeScenes) {
      for (let i = scenes.length - 1; i >= 0; i--) {
        const scene = scenes[i];
        
        try {
          scene.update(deltaTime);
          
          // Remove finished scenes
          if (scene.isFinished()) {
            console.log(`[SceneManager] Scene ${scene.getId()} (${sceneType}) finished`);
            scene.onDestroy();
            scenes.splice(i, 1);
          }
        } catch (error) {
          console.error(`[SceneManager] Error updating scene ${scene.getId()}:`, error);
          // Remove problematic scene
          scenes.splice(i, 1);
        }
      }
      
      // Clean up empty scene type arrays
      if (scenes.length === 0) {
        this.activeScenes.delete(sceneType);
      }
    }
  }

  render(context: CanvasRenderingContext2D): void {
    // Render all active scenes
    for (const scenes of this.activeScenes.values()) {
      for (const scene of scenes) {
        try {
          scene.render(context);
        } catch (error) {
          console.error(`[SceneManager] Error rendering scene ${scene.getId()}:`, error);
        }
      }
    }
  }

  shutdown(): void {
    console.log('[SceneManager] Shutting down...');
    
    // Destroy all active scenes
    for (const scenes of this.activeScenes.values()) {
      for (const scene of scenes) {
        scene.onDestroy();
      }
    }
    
    this.activeScenes.clear();
    this.sceneQueue.length = 0;
  }

  // Debug information
  getActiveSceneCount(): number {
    let count = 0;
    for (const scenes of this.activeScenes.values()) {
      count += scenes.length;
    }
    return count;
  }

  getQueueLength(): number {
    return this.sceneQueue.length;
  }

  private handleAlwaysNew(config: SceneConfig, payload: any): void {
    const existingScenes = this.activeScenes.get(config.sceneType) || [];
    
    // Check max concurrent limit
    if (config.maxConcurrent && existingScenes.length >= config.maxConcurrent) {
      console.warn(`[SceneManager] Max concurrent scenes reached for ${config.sceneType} (${config.maxConcurrent})`);
      return;
    }

    // Always create new scene immediately
    this.createScene(config.sceneType, payload);
  }

  private handleQueueIfActive(config: SceneConfig, payload: any): void {
    const existingScenes = this.activeScenes.get(config.sceneType) || [];
    
    if (existingScenes.length === 0) {
      // No active scenes, create immediately
      this.createScene(config.sceneType, payload);
    } else {
      // Queue for later
      this.queueScene(config, payload);
    }
  }

  private handleNotifyExisting(config: SceneConfig, payload: any): void {
    const existingScenes = this.activeScenes.get(config.sceneType) || [];
    
    if (existingScenes.length > 0) {
      // Notify existing scene(s)
      for (const scene of existingScenes) {
        if (scene.handleNotification) {
          scene.handleNotification(payload);
        }
      }
    } else {
      // No existing scene, create new one
      this.createScene(config.sceneType, payload);
    }
  }

  private queueScene(config: SceneConfig, payload: any): void {
    // Check queue limit
    if (config.queueLimit) {
      const queuedCount = this.sceneQueue.filter(q => q.sceneType === config.sceneType).length;
      if (queuedCount >= config.queueLimit) {
        console.warn(`[SceneManager] Queue limit reached for ${config.sceneType} (${config.queueLimit})`);
        return;
      }
    }

    const queuedScene: QueuedScene = {
      sceneType: config.sceneType,
      payload,
      timestamp: Date.now()
    };

    this.sceneQueue.push(queuedScene);
    console.log(`[SceneManager] Queued scene: ${config.sceneType}, queue length: ${this.sceneQueue.length}`);
  }

  private processQueue(): void {
    if (this.sceneQueue.length === 0) return;

    // Process queue in FIFO order
    for (let i = 0; i < this.sceneQueue.length; i++) {
      const queuedScene = this.sceneQueue[i];
      const config = SCENE_CONFIGS.get(queuedScene.sceneType);
      
      if (!config) continue;

      const existingScenes = this.activeScenes.get(queuedScene.sceneType) || [];
      
      // Check if we can now create this queued scene
      if (existingScenes.length === 0 || 
          (config.maxConcurrent && existingScenes.length < config.maxConcurrent)) {
        
        // Remove from queue and create scene
        this.sceneQueue.splice(i, 1);
        this.createScene(queuedScene.sceneType, queuedScene.payload);
        
        console.log(`[SceneManager] Processed queued scene: ${queuedScene.sceneType}`);
        
        // Only process one queued scene per frame to prevent frame spikes
        break;
      }
    }
  }

  private createScene(sceneType: string, payload: any): void {
    try {
      const scene = SceneFactory.createScene(sceneType, this.nextSceneId++, this.assetManager, payload);
      
      if (!this.activeScenes.has(sceneType)) {
        this.activeScenes.set(sceneType, []);
      }
      
      this.activeScenes.get(sceneType)!.push(scene);
      
      console.log(`[SceneManager] Created scene: ${sceneType} (ID: ${scene.getId()})`);
      
      // Initialize scene asynchronously
      scene.onInitialize().catch(error => {
        console.error(`[SceneManager] Failed to initialize scene ${scene.getId()}:`, error);
      });
      
    } catch (error) {
      console.error(`[SceneManager] Failed to create scene ${sceneType}:`, error);
    }
  }
}
```

## Scene Factory Pattern

### Scene Creation Factory
```typescript
class SceneFactory {
  private static sceneConstructors: Map<string, (id: number, assetManager: AssetManager, payload: any) => Scene> = new Map();

  static registerScene(sceneType: string, constructor: (id: number, assetManager: AssetManager, payload: any) => Scene): void {
    SceneFactory.sceneConstructors.set(sceneType, constructor);
  }

  static createScene(sceneType: string, id: number, assetManager: AssetManager, payload: any): Scene {
    const constructor = SceneFactory.sceneConstructors.get(sceneType);
    if (!constructor) {
      throw new Error(`No scene constructor registered for type: ${sceneType}`);
    }
    
    return constructor(id, assetManager, payload);
  }

  // Register all available scenes
  static initializeSceneTypes(): void {
    SceneFactory.registerScene('dvd', (id, assetManager, payload) => 
      new DvdScene(id, assetManager, payload)
    );

    SceneFactory.registerScene('xJason', (id, assetManager, payload) => 
      new XJasonScene(id, assetManager, payload)
    );

    SceneFactory.registerScene('confetti', (id, assetManager, payload) => 
      new ConfettiScene(id, assetManager, payload)
    );

    SceneFactory.registerScene('zeldaChest', (id, assetManager, payload) => 
      new ZeldaChestScene(id, assetManager, payload)
    );

    SceneFactory.registerScene('bamSuccess', (id, assetManager, payload) => 
      new BamScene(id, assetManager, payload, 'success')
    );

    SceneFactory.registerScene('bamFailure', (id, assetManager, payload) => 
      new BamScene(id, assetManager, payload, 'failure')
    );

    SceneFactory.registerScene('ssbmSuccess', (id, assetManager, payload) => 
      new SsbmScene(id, assetManager, payload, 'success')
    );

    SceneFactory.registerScene('ssbmFailure', (id, assetManager, payload) => 
      new SsbmScene(id, assetManager, payload, 'failure')
    );

    SceneFactory.registerScene('dvdNotify', (id, assetManager, payload) => 
      new NotifiableDvdScene(id, assetManager, payload)
    );
  }
}

// Initialize scene types when module loads
SceneFactory.initializeSceneTypes();
```

## Enhanced Scene Base Class

### Scene with Notification Support
```typescript
export abstract class Scene {
  protected id: number;
  protected assetManager: AssetManager;
  protected entities: Entity[] = [];
  protected systems: BaseSystem[] = [];
  protected isInitialized: boolean = false;
  protected creationTime: number;

  constructor(id: number, assetManager: AssetManager) {
    this.id = id;
    this.assetManager = assetManager;
    this.creationTime = Date.now();
  }

  getId(): number {
    return this.id;
  }

  getAge(): number {
    return Date.now() - this.creationTime;
  }

  // Optional notification handler for NOTIFY_EXISTING behavior
  handleNotification?(payload: any): void;

  async onInitialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.initializeScene();
    this.isInitialized = true;
  }

  update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Update all systems
    for (const system of this.systems) {
      system.update(this.entities, deltaTime);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    if (!this.isInitialized) return;

    // Render through systems
    for (const system of this.systems) {
      if (system instanceof RenderSystem) {
        system.render(this.entities, context);
      }
    }
  }

  onDestroy(): void {
    // Clean up entities
    for (const entity of this.entities) {
      if (entity.getState() !== EntityState.FINISHED) {
        entity.setState(EntityState.FINISHED);
      }
    }

    // Clean up systems
    for (const system of this.systems) {
      system.onDestroy();
    }

    this.entities.length = 0;
    this.systems.length = 0;
  }

  isFinished(): boolean {
    // Scene is finished when all entities are finished
    return this.entities.every(entity => 
      entity.getState() === EntityState.FINISHED
    );
  }

  protected abstract initializeScene(): Promise<void>;

  // Helper methods for scene management
  protected addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  protected removeEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }
  }

  protected addSystem(system: BaseSystem): void {
    this.systems.push(system);
  }
}
```

## Specific Scene Coordination Examples

### DVD Scene (Always New)
```typescript
class DvdScene extends Scene {
  constructor(id: number, assetManager: AssetManager, payload: any) {
    super(id, assetManager);
    // payload could contain logo type, speed, etc.
  }

  protected async initializeScene(): Promise<void> {
    // Create DVD bouncing entity
    const dvdEntity = new ImageEntity('dvdLogo.png', {
      type: ProgressionType.INFINITE // Never-ending bounce
    });

    // Add bouncing behavior
    const bounceBehavior = new ScreenBounceBehavior();
    const movementBehavior = new MovementBehavior(2, 1.5); // Random direction

    dvdEntity.addBehavior(bounceBehavior);
    dvdEntity.addBehavior(movementBehavior);

    this.addEntity(dvdEntity);
    this.addSystem(new UpdateSystem());
    this.addSystem(new RenderSystem());
  }
}

// Usage Example - Multiple DVD commands create multiple scenes:
// Command 1: "dvd" → Creates DvdScene #1 with 1 bouncing logo
// Command 2: "dvd" → Creates DvdScene #2 with 1 bouncing logo  
// Command 3: "dvd" → Creates DvdScene #3 with 1 bouncing logo
// Result: 3 independent scenes, each with 1 logo bouncing
```

### xJason Scene (Queue if Active)
```typescript
class XJasonScene extends Scene {
  private totalDuration: number = 70000; // 70 seconds
  
  constructor(id: number, assetManager: AssetManager, payload: any) {
    super(id, assetManager);
  }

  protected async initializeScene(): Promise<void> {
    // Scene has its own progression
    const sceneProgression = new ProgressionManager({
      type: ProgressionType.TIME_BASED,
      duration: this.totalDuration,
      curve: ProgressionCurves.linear
    });

    // Create audio entity
    const audioEntity = new AudioEntity('heavyrain-jason.mp3', {
      type: ProgressionType.TIME_BASED,
      duration: this.totalDuration,
      autoFinish: true
    });

    this.addEntity(audioEntity);
    this.addSystem(new UpdateSystem());
    this.addSystem(new RenderSystem());

    // Periodically spawn xJason images based on scene progression
    this.scheduleImageSpawning();
  }

  private scheduleImageSpawning(): void {
    const spawnInterval = setInterval(() => {
      if (this.isFinished()) {
        clearInterval(spawnInterval);
        return;
      }

      // Spawn new xJason image
      const imageEntity = new ImageEntity('xJason.svg', {
        type: ProgressionType.TIME_BASED,
        duration: 2000 + Math.random() * 1000, // 2-3 seconds
        curve: ProgressionCurves.fadeInHoldOut(0.2, 0.8)
      });

      // Random position
      if (imageEntity instanceof TransformEntity) {
        imageEntity.x = Math.random() * 800;
        imageEntity.y = Math.random() * 600;
      }

      this.addEntity(imageEntity);
    }, 1000); // Spawn every second
  }
}

// Usage Example - Queue behavior:
// Command 1: "xJason" → Creates XJasonScene #1, starts 70s sequence
// Command 2: "xJason" (while #1 active) → Queued
// Command 3: "xJason" (while #1 active) → Queued  
// Scene #1 finishes → Automatically start queued scene #2
// Scene #2 finishes → Automatically start queued scene #3
// Result: Sequential xJason scenes, never overlapping
```

### Notifiable DVD Scene
```typescript
class NotifiableDvdScene extends Scene {
  private logoCount: number = 1;
  
  constructor(id: number, assetManager: AssetManager, payload: any) {
    super(id, assetManager);
  }

  protected async initializeScene(): Promise<void> {
    this.createDvdLogo();
    this.addSystem(new UpdateSystem());
    this.addSystem(new RenderSystem());
  }

  // Handle notifications to add more logos
  handleNotification(payload: any): void {
    console.log(`[NotifiableDvdScene] Received notification, adding logo #${this.logoCount + 1}`);
    this.createDvdLogo();
    this.logoCount++;
  }

  private createDvdLogo(): void {
    const dvdEntity = new ImageEntity('dvdLogo.png', {
      type: ProgressionType.INFINITE
    });

    // Random starting position and direction
    if (dvdEntity instanceof TransformEntity) {
      dvdEntity.x = Math.random() * 400;
      dvdEntity.y = Math.random() * 300;
    }

    const bounceBehavior = new ScreenBounceBehavior();
    const movementBehavior = new MovementBehavior(
      (Math.random() - 0.5) * 4, // Random X velocity
      (Math.random() - 0.5) * 4  // Random Y velocity
    );

    dvdEntity.addBehavior(bounceBehavior);
    dvdEntity.addBehavior(movementBehavior);

    this.addEntity(dvdEntity);
  }
}

// Usage Example - Notification behavior:
// Command 1: "dvdNotify" → Creates NotifiableDvdScene #1 with 1 logo
// Command 2: "dvdNotify" → Sends notification to existing scene, adds logo #2
// Command 3: "dvdNotify" → Sends notification to existing scene, adds logo #3  
// Result: One scene with 3 logos bouncing simultaneously
```

## Configuration-Driven Scene Management

### Extended Scene Configuration
```typescript
interface SceneConfigurationOptions extends SceneConfig {
  // Payload processing
  payloadValidator?: (payload: any) => boolean;
  payloadTransformer?: (payload: any) => any;
  
  // Lifecycle options
  defaultDuration?: number;
  autoCleanup?: boolean;
  cleanupDelay?: number;
  
  // Resource management
  preloadAssets?: string[];
  maxMemoryUsage?: number;
  
  // Notification handling
  supportsNotifications?: boolean;
  notificationMergeStrategy?: 'replace' | 'merge' | 'queue';
}

// Extended configurations
const EXTENDED_SCENE_CONFIGS: Map<string, SceneConfigurationOptions> = new Map([
  ['dvd', {
    sceneType: 'dvd',
    behaviorType: SceneBehaviorType.ALWAYS_NEW,
    maxConcurrent: 10,
    autoCleanup: false, // DVD scenes run indefinitely
    preloadAssets: ['dvdLogo.png'],
    payloadValidator: (payload) => payload && typeof payload.speed === 'number',
    payloadTransformer: (payload) => ({
      speed: Math.max(0.5, Math.min(5.0, payload.speed || 2.0)),
      logo: payload.logo || 'dvdLogo.png'
    })
  }],
  
  ['xJason', {
    sceneType: 'xJason',
    behaviorType: SceneBehaviorType.QUEUE_IF_ACTIVE,
    maxConcurrent: 1,
    queueLimit: 3,
    defaultDuration: 70000,
    autoCleanup: true,
    cleanupDelay: 1000,
    preloadAssets: ['xJason.svg', 'heavyrain-jason.mp3'],
    payloadValidator: (payload) => true, // xJason accepts any payload
    payloadTransformer: (payload) => ({
      duration: payload?.duration || 70000,
      intensity: payload?.intensity || 'normal'
    })
  }],
  
  ['dvdNotify', {
    sceneType: 'dvdNotify',
    behaviorType: SceneBehaviorType.NOTIFY_EXISTING,
    maxConcurrent: 1,
    supportsNotifications: true,
    notificationMergeStrategy: 'queue',
    preloadAssets: ['dvdLogo.png'],
    payloadValidator: (payload) => payload && payload.action === 'addLogo',
    payloadTransformer: (payload) => ({
      logoCount: payload.count || 1,
      logoType: payload.logoType || 'dvd'
    })
  }]
]);
```

## Integration with Application

### Application Bootstrap
```typescript
// In main application initialization
class OverlayApplication {
  private sceneManager: SceneManager;
  private streamerbotManager: StreamerbotManager;

  constructor() {
    // Initialize SceneManager with canvas context and AssetManager
    this.sceneManager = new SceneManager(this.context, this.assetManager);
    this.streamerbotManager = new StreamerbotManager();
    
    this.setupStreamerbotHandlers();
  }

  private setupStreamerbotHandlers(): void {
    // Route Streamerbot commands to SceneManager
    this.streamerbotManager.onCommand('dvd', (payload) => {
      this.sceneManager.handleCommand('dvd', payload);
    });

    this.streamerbotManager.onCommand('xJason', (payload) => {
      this.sceneManager.handleCommand('xJason', payload);
    });

    this.streamerbotManager.onCommand('dvdNotify', (payload) => {
      this.sceneManager.handleCommand('dvdNotify', payload);
    });
    
    // Add other command handlers...
  }

  private gameLoop = (): void => {
    const deltaTime = /* calculate delta time */;
    
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and render through SceneManager
    this.sceneManager.update(deltaTime);
    this.sceneManager.render(this.context);

    requestAnimationFrame(this.gameLoop);
  };
}
```

## Performance and Memory Considerations

### Scene Lifecycle Optimization
```typescript
class OptimizedSceneManager extends SceneManager {
  private scenePool: Map<string, Scene[]> = new Map();
  private maxPoolSize: number = 5;

  // Reuse scenes when possible
  private createScene(sceneType: string, payload: any): void {
    const pooledScenes = this.scenePool.get(sceneType) || [];
    
    if (pooledScenes.length > 0) {
      // Reuse pooled scene
      const scene = pooledScenes.pop()!;
      scene.reset(payload); // Reset scene state
      
      if (!this.activeScenes.has(sceneType)) {
        this.activeScenes.set(sceneType, []);
      }
      this.activeScenes.get(sceneType)!.push(scene);
      
      console.log(`[SceneManager] Reused pooled scene: ${sceneType}`);
    } else {
      // Create new scene (fallback to parent implementation)
      super.createScene(sceneType, payload);
    }
  }

  // Pool finished scenes for reuse
  private cleanupFinishedScene(scene: Scene, sceneType: string): void {
    const pooledScenes = this.scenePool.get(sceneType) || [];
    
    if (pooledScenes.length < this.maxPoolSize && scene.canBePooled()) {
      scene.cleanup(); // Prepare for pooling
      pooledScenes.push(scene);
      this.scenePool.set(sceneType, pooledScenes);
      
      console.log(`[SceneManager] Pooled scene: ${sceneType}`);
    } else {
      scene.onDestroy(); // Fully destroy
    }
  }
}
```

This SceneManager architecture provides:

1. **Three Distinct Coordination Patterns**: Always new (DVD), queue if active (xJason), notify existing (enhanced DVD)
2. **Flexible Configuration System**: Data-driven scene behavior without code changes
3. **Queue Management**: Proper queuing for scenes that shouldn't overlap
4. **Notification System**: Existing scenes can receive and process new data
5. **Performance Optimization**: Scene pooling, efficient lifecycle management
6. **Error Resilience**: Graceful handling of scene creation/update failures
7. **Resource Management**: Asset preloading and memory management
8. **Factory Pattern**: Clean scene creation and registration system

The key innovation is the `SceneBehaviorType` enum that encapsulates your exact requirements while maintaining flexibility for future scene types.