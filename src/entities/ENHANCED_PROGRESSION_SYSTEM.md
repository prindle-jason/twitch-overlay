# Enhanced Progression System Design

## Overview
The Progression system provides flexible, behavior-driven timing and completion tracking for entities. It goes beyond simple 0-1 progress to support complex progression patterns that behaviors can coordinate around.

## Current State Assessment
The current Entity implementation has a basic progression system:
```typescript
class Entity {
  private _progress: number = 0; // Simple 0-1 range
  
  getProgress(): number { return this._progress; }
  setProgress(value: number): void { 
    this._progress = Math.max(0, Math.min(1, value)); 
  }
}
```

**Limitations of Current Approach:**
- Only supports linear 0-1 progression
- No built-in progression drivers (time, events, conditions)
- No support for complex progression curves
- Limited behavior coordination capabilities

## Enhanced Progression Concepts

### Progression Types
```typescript
enum ProgressionType {
  TIME_BASED = 'time',           // Duration-driven progression
  EVENT_BASED = 'event',         // Event-driven progression points
  CONDITION_BASED = 'condition', // State/condition-driven progression
  MANUAL = 'manual',             // Explicitly controlled progression
  INFINITE = 'infinite'          // Never-ending entities (particles, loops)
}

interface ProgressionConfig {
  type: ProgressionType;
  duration?: number;              // For TIME_BASED
  events?: string[];              // For EVENT_BASED
  condition?: () => boolean;      // For CONDITION_BASED
  curve?: ProgressionCurve;       // Easing/interpolation function
  autoFinish?: boolean;           // Whether to auto-finish at 1.0
}

interface ProgressionCurve {
  (progress: number): number; // Input 0-1, output 0-1 (can exceed for bounces/overshoots)
}
```

### Enhanced Progression API
```typescript
class ProgressionManager {
  private type: ProgressionType;
  private config: ProgressionConfig;
  private _rawProgress: number = 0;
  private _curvedProgress: number = 0;
  private elapsedTime: number = 0;
  private eventMarkers: Set<string> = new Set();

  constructor(config: ProgressionConfig) {
    this.type = config.type;
    this.config = config;
  }

  // Main update method called by UpdateSystem
  update(deltaTime: number): void {
    switch (this.type) {
      case ProgressionType.TIME_BASED:
        this.updateTimeBased(deltaTime);
        break;
      case ProgressionType.EVENT_BASED:
        this.updateEventBased();
        break;
      case ProgressionType.CONDITION_BASED:
        this.updateConditionBased();
        break;
      case ProgressionType.INFINITE:
        this.updateInfinite(deltaTime);
        break;
      // MANUAL doesn't auto-update
    }
    
    // Apply progression curve
    this._curvedProgress = this.config.curve ? 
      this.config.curve(this._rawProgress) : 
      this._rawProgress;
  }

  // Get progression values
  getRawProgress(): number { return this._rawProgress; }
  getCurvedProgress(): number { return this._curvedProgress; }
  getElapsedTime(): number { return this.elapsedTime; }
  
  // Manual progression control
  setProgress(value: number): void {
    this._rawProgress = Math.max(0, Math.min(1, value));
  }
  
  // Event-based progression
  triggerEvent(eventName: string): void {
    if (this.type === ProgressionType.EVENT_BASED && 
        this.config.events?.includes(eventName)) {
      this.eventMarkers.add(eventName);
      this.recalculateEventProgress();
    }
  }
  
  // Condition checking
  isFinished(): boolean {
    if (this.type === ProgressionType.INFINITE) return false;
    if (!this.config.autoFinish) return false;
    return this._rawProgress >= 1.0;
  }

  private updateTimeBased(deltaTime: number): void {
    if (!this.config.duration) return;
    
    this.elapsedTime += deltaTime;
    this._rawProgress = Math.min(this.elapsedTime / this.config.duration, 1.0);
  }

  private updateEventBased(): void {
    if (!this.config.events) return;
    this.recalculateEventProgress();
  }

  private updateConditionBased(): void {
    if (this.config.condition && this.config.condition()) {
      this._rawProgress = 1.0;
    }
  }

  private updateInfinite(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    // For infinite entities, progress cycles or grows without bound
    // Behaviors can interpret this however they need
    this._rawProgress = (this.elapsedTime / 1000) % 1.0; // 1-second cycle
  }

  private recalculateEventProgress(): void {
    if (!this.config.events) return;
    this._rawProgress = this.eventMarkers.size / this.config.events.length;
  }
}
```

### Integration with Entity System
```typescript
export abstract class Entity {
  private progressionManager: ProgressionManager;
  
  constructor(
    name: string, 
    progressionConfig: ProgressionConfig = { type: ProgressionType.MANUAL }
  ) {
    // ... existing constructor
    this.progressionManager = new ProgressionManager(progressionConfig);
  }

  // Enhanced progression API
  getProgress(): number {
    return this.progressionManager.getCurvedProgress();
  }
  
  getRawProgress(): number {
    return this.progressionManager.getRawProgress();
  }
  
  getElapsedTime(): number {
    return this.progressionManager.getElapsedTime();
  }
  
  setProgress(value: number): void {
    this.progressionManager.setProgress(value);
  }
  
  triggerEvent(eventName: string): void {
    this.progressionManager.triggerEvent(eventName);
  }
  
  // Called by UpdateSystem during entity updates
  updateProgression(deltaTime: number): void {
    this.progressionManager.update(deltaTime);
    
    // Auto-finish if progression indicates completion
    if (this.progressionManager.isFinished() && this.state === EntityState.PLAYING) {
      this.setState(EntityState.FINISHED);
    }
  }
}
```

## Progression Curve Library

### Standard Easing Functions
```typescript
const ProgressionCurves = {
  // Linear
  linear: (t: number) => t,
  
  // Ease In/Out
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // Cubic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Elastic
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Bounce
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  
  // Custom: Fade in/hold/fade out
  fadeInHoldOut: (fadeInEnd: number = 0.2, fadeOutStart: number = 0.8) => {
    return (t: number) => {
      if (t <= fadeInEnd) {
        return t / fadeInEnd; // Fade in
      } else if (t >= fadeOutStart) {
        return 1 - ((t - fadeOutStart) / (1 - fadeOutStart)); // Fade out
      } else {
        return 1; // Hold
      }
    };
  },
  
  // Custom: Pulse/heartbeat
  pulse: (frequency: number = 2) => {
    return (t: number) => (Math.sin(t * Math.PI * frequency) + 1) / 2;
  }
};
```

## Behavior Coordination Patterns

### Progression-Aware Behaviors
```typescript
class FadeInOutBehavior extends Behavior {
  constructor(
    private fadeInEnd: number = 0.2, 
    private fadeOutStart: number = 0.8
  ) {
    super('fadeInOut');
  }

  update(entity: Entity, deltaTime: number): void {
    if (!(entity instanceof RenderableEntity)) return;

    const progress = entity.getProgress();
    
    if (progress <= this.fadeInEnd) {
      // Fade in phase
      entity.opacity = progress / this.fadeInEnd;
    } else if (progress >= this.fadeOutStart) {
      // Fade out phase
      const fadeProgress = (progress - this.fadeOutStart) / (1 - this.fadeOutStart);
      entity.opacity = 1 - fadeProgress;
    } else {
      // Full opacity phase
      entity.opacity = 1;
    }
  }
}

class ScaleWaveBehavior extends Behavior {
  constructor(
    private amplitude: number = 0.2,
    private frequency: number = 3
  ) {
    super('scaleWave');
  }

  update(entity: Entity, deltaTime: number): void {
    if (!(entity instanceof TransformEntity)) return;

    const progress = entity.getProgress();
    const waveValue = Math.sin(progress * Math.PI * this.frequency);
    const scaleMultiplier = 1 + (waveValue * this.amplitude);
    
    entity.scaleX = scaleMultiplier;
    entity.scaleY = scaleMultiplier;
  }
}

class MovementBehavior extends Behavior {
  private startX: number = 0;
  private startY: number = 0;
  
  constructor(
    private deltaX: number, 
    private deltaY: number,
    private curve: ProgressionCurve = ProgressionCurves.easeInOutQuad
  ) {
    super('movement');
  }

  onAttach(entity: Entity): void {
    if (entity instanceof TransformEntity) {
      this.startX = entity.x;
      this.startY = entity.y;
    }
  }

  update(entity: Entity, deltaTime: number): void {
    if (!(entity instanceof TransformEntity)) return;

    const rawProgress = entity.getRawProgress();
    const curvedProgress = this.curve(rawProgress);
    
    entity.x = this.startX + (this.deltaX * curvedProgress);
    entity.y = this.startY + (this.deltaY * curvedProgress);
  }
}
```

### Multi-Phase Behaviors
```typescript
interface ProgressionPhase {
  start: number;     // 0-1 where this phase begins
  end: number;       // 0-1 where this phase ends
  curve?: ProgressionCurve;
}

class MultiPhaseBehavior extends Behavior {
  protected phases: Map<string, ProgressionPhase> = new Map();
  
  addPhase(name: string, phase: ProgressionPhase): void {
    this.phases.set(name, phase);
  }
  
  getCurrentPhase(progress: number): string | null {
    for (const [name, phase] of this.phases) {
      if (progress >= phase.start && progress <= phase.end) {
        return name;
      }
    }
    return null;
  }
  
  getPhaseProgress(progress: number, phaseName: string): number {
    const phase = this.phases.get(phaseName);
    if (!phase) return 0;
    
    const phaseProgress = (progress - phase.start) / (phase.end - phase.start);
    const clampedProgress = Math.max(0, Math.min(1, phaseProgress));
    
    return phase.curve ? phase.curve(clampedProgress) : clampedProgress;
  }
}

class ChestOpeningBehavior extends MultiPhaseBehavior {
  constructor() {
    super('chestOpening');
    
    // Define chest opening phases
    this.addPhase('anticipation', { 
      start: 0.0, 
      end: 0.2, 
      curve: ProgressionCurves.easeInQuad 
    });
    
    this.addPhase('opening', { 
      start: 0.2, 
      end: 0.7, 
      curve: ProgressionCurves.easeOutBounce 
    });
    
    this.addPhase('glowing', { 
      start: 0.7, 
      end: 1.0, 
      curve: ProgressionCurves.pulse(3) 
    });
  }

  update(entity: Entity, deltaTime: number): void {
    const progress = entity.getProgress();
    const currentPhase = this.getCurrentPhase(progress);
    
    switch (currentPhase) {
      case 'anticipation':
        this.updateAnticipation(entity, this.getPhaseProgress(progress, 'anticipation'));
        break;
      case 'opening':
        this.updateOpening(entity, this.getPhaseProgress(progress, 'opening'));
        break;
      case 'glowing':
        this.updateGlowing(entity, this.getPhaseProgress(progress, 'glowing'));
        break;
    }
  }
  
  private updateAnticipation(entity: Entity, phaseProgress: number): void {
    // Slight wiggle or scale before opening
    if (entity instanceof TransformEntity) {
      entity.scaleX = 1 + (phaseProgress * 0.1);
      entity.scaleY = 1 + (phaseProgress * 0.1);
    }
  }
  
  private updateOpening(entity: Entity, phaseProgress: number): void {
    // Chest lid rotation or position change
    // Implementation depends on entity structure
  }
  
  private updateGlowing(entity: Entity, phaseProgress: number): void {
    // Pulsing glow effect
    if (entity instanceof RenderableEntity) {
      entity.opacity = 0.8 + (phaseProgress * 0.2);
    }
  }
}
```

## Event-Driven Progression Examples

### Audio-Synchronized Progression
```typescript
class AudioSyncEntity extends AudioEntity {
  constructor(audioPath: string) {
    super(audioPath, {
      type: ProgressionType.EVENT_BASED,
      events: ['audioStart', 'audioMidpoint', 'audioEnd'],
      autoFinish: true
    });
  }

  async onInitialize(): Promise<void> {
    await super.onInitialize();
    
    if (this.audio) {
      this.audio.addEventListener('play', () => {
        this.triggerEvent('audioStart');
      });
      
      this.audio.addEventListener('timeupdate', () => {
        const progress = this.audio!.currentTime / this.audio!.duration;
        if (progress >= 0.5 && !this.hasTriggeredEvent('audioMidpoint')) {
          this.triggerEvent('audioMidpoint');
        }
      });
      
      this.audio.addEventListener('ended', () => {
        this.triggerEvent('audioEnd');
      });
    }
  }
  
  private hasTriggeredEvent(eventName: string): boolean {
    // Implementation would track triggered events
    return false; // Placeholder
  }
}
```

### User Interaction Progression
```typescript
class InteractiveEntity extends TransformEntity {
  private interactionCount: number = 0;
  private requiredInteractions: number = 3;
  
  constructor(name: string, requiredInteractions: number = 3) {
    super(name, {
      type: ProgressionType.MANUAL,
      autoFinish: true
    });
    this.requiredInteractions = requiredInteractions;
  }
  
  handleClick(): void {
    this.interactionCount++;
    const progress = this.interactionCount / this.requiredInteractions;
    this.setProgress(progress);
    
    // Trigger completion when enough interactions
    if (this.interactionCount >= this.requiredInteractions) {
      this.setState(EntityState.FINISHED);
    }
  }
}
```

## Complex Progression Scenarios

### Synchronized Entity Groups
```typescript
class EntityGroup {
  private entities: Entity[] = [];
  private groupProgression: ProgressionManager;
  
  constructor(progressionConfig: ProgressionConfig) {
    this.groupProgression = new ProgressionManager(progressionConfig);
  }
  
  addEntity(entity: Entity): void {
    this.entities.push(entity);
    
    // Override entity's individual progression with group progression
    entity.setProgressionManager(this.groupProgression);
  }
  
  update(deltaTime: number): void {
    this.groupProgression.update(deltaTime);
    
    // All entities in group share the same progression
    const progress = this.groupProgression.getCurvedProgress();
    this.entities.forEach(entity => {
      entity.setProgress(progress);
    });
  }
}

// Usage: Synchronized confetti particles
const confettiGroup = new EntityGroup({
  type: ProgressionType.TIME_BASED,
  duration: 5000,
  curve: ProgressionCurves.easeOutQuad
});

for (let i = 0; i < 50; i++) {
  const particle = new ConfettiParticle();
  confettiGroup.addEntity(particle);
}
```

### Progression Branching
```typescript
class ConditionalProgressionEntity extends Entity {
  private branchCondition: () => boolean;
  private trueProgression: ProgressionManager;
  private falseProgression: ProgressionManager;
  private currentProgression: ProgressionManager;
  
  constructor(
    name: string,
    condition: () => boolean,
    trueConfig: ProgressionConfig,
    falseConfig: ProgressionConfig
  ) {
    super(name, { type: ProgressionType.MANUAL });
    
    this.branchCondition = condition;
    this.trueProgression = new ProgressionManager(trueConfig);
    this.falseProgression = new ProgressionManager(falseConfig);
    this.currentProgression = this.trueProgression; // Default
  }
  
  updateProgression(deltaTime: number): void {
    // Check condition and switch progression if needed
    const shouldUseTrue = this.branchCondition();
    this.currentProgression = shouldUseTrue ? this.trueProgression : this.falseProgression;
    
    this.currentProgression.update(deltaTime);
    this.setProgress(this.currentProgression.getCurvedProgress());
  }
}

// Usage: Different progression based on success/failure
const achievementEntity = new ConditionalProgressionEntity(
  'achievement',
  () => player.score > 1000, // Condition
  { 
    type: ProgressionType.TIME_BASED, 
    duration: 2000, 
    curve: ProgressionCurves.easeOutBounce 
  }, // Success progression
  { 
    type: ProgressionType.TIME_BASED, 
    duration: 1000, 
    curve: ProgressionCurves.easeInQuad 
  }  // Failure progression
);
```

## Integration with Scene System

### Scene-Level Progression Control
```typescript
class XJasonScene extends Scene {
  private sceneProgression: ProgressionManager;
  
  constructor() {
    super();
    
    // Scene has its own progression that entities can reference
    this.sceneProgression = new ProgressionManager({
      type: ProgressionType.TIME_BASED,
      duration: 70000, // 70 seconds for full scene
      curve: ProgressionCurves.linear
    });
  }
  
  update(deltaTime: number): void {
    // Update scene progression
    this.sceneProgression.update(deltaTime);
    
    // Spawn new entities based on scene progression
    const sceneProgress = this.sceneProgression.getCurvedProgress();
    if (sceneProgress > 0.1 && this.shouldSpawnNewImage()) {
      this.spawnXJasonImage();
    }
    
    super.update(deltaTime);
  }
  
  private spawnXJasonImage(): void {
    const image = new ImageEntity('xJason.svg', {
      type: ProgressionType.TIME_BASED,
      duration: 2000 + Math.random() * 1000, // 2-3 seconds
      curve: ProgressionCurves.fadeInHoldOut(0.2, 0.8)
    });
    
    // Image progression is independent of scene progression
    this.addEntity(image);
  }
  
  isFinished(): boolean {
    return this.sceneProgression.isFinished() && 
           this.entities.length === 0;
  }
}
```

## Performance and Memory Considerations

### Progression Optimization
```typescript
class OptimizedProgressionManager extends ProgressionManager {
  private static curveCache = new Map<string, ProgressionCurve>();
  
  // Cache expensive curve calculations
  private getCachedCurve(curveName: string): ProgressionCurve {
    if (!OptimizedProgressionManager.curveCache.has(curveName)) {
      OptimizedProgressionManager.curveCache.set(curveName, this.buildCurve(curveName));
    }
    return OptimizedProgressionManager.curveCache.get(curveName)!;
  }
  
  // Only update progression if significant change
  private static readonly MIN_PROGRESS_DELTA = 0.001;
  private lastProgress: number = -1;
  
  update(deltaTime: number): void {
    const previousProgress = this._rawProgress;
    super.update(deltaTime);
    
    // Skip curve calculation if minimal change
    if (Math.abs(this._rawProgress - this.lastProgress) < OptimizedProgressionManager.MIN_PROGRESS_DELTA) {
      return;
    }
    
    this.lastProgress = this._rawProgress;
    // Continue with curve application...
  }
}
```

This enhanced progression system provides powerful coordination mechanisms for behaviors while maintaining performance and flexibility. The key insight is that progression becomes a first-class coordination mechanism that behaviors can rely on, rather than each behavior managing its own timing independently.