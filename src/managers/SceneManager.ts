import { Scene } from '../scenes/Scene';
import { BamSuccessScene } from '../scenes/BamSuccessScene';

/**
 * SceneManager - Minimal scene management for MVP
 * 
 * Handles scene creation, lifecycle, and cleanup.
 * This is a simplified version focused on basic functionality.
 */

interface SceneFactory {
  (): Scene;
}

export class SceneManager {
  private activeScenes: Scene[] = [];
  private sceneFactories: Map<string, SceneFactory> = new Map();
  private canvasWidth: number = 1280;
  private canvasHeight: number = 720;

  constructor(canvasWidth?: number, canvasHeight?: number) {
    if (canvasWidth && canvasHeight) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
    }
    
    this.registerDefaultScenes();
    console.log(`🎭 SceneManager initialized (${this.canvasWidth}x${this.canvasHeight})`);
  }

  // === Scene Registration ===

  private registerDefaultScenes(): void {
    // Register available scene types
    this.sceneFactories.set('bamSuccess', () => {
      const scene = BamSuccessScene.createBobSuccess();
      scene.setCanvasSize(this.canvasWidth, this.canvasHeight);
      return scene;
    });

    this.sceneFactories.set('bamFailure', () => {
      const scene = BamSuccessScene.createCustomSuccess('bobFailure.png', 2000);
      scene.setCanvasSize(this.canvasWidth, this.canvasHeight);
      return scene;
    });

    this.sceneFactories.set('bubSuccess', () => {
      const scene = BamSuccessScene.createBubSuccess();
      scene.setCanvasSize(this.canvasWidth, this.canvasHeight);
      return scene;
    });

    this.sceneFactories.set('bubFailure', () => {
      const scene = BamSuccessScene.createCustomSuccess('bubFailure.png', 2000);
      scene.setCanvasSize(this.canvasWidth, this.canvasHeight);
      return scene;
    });

    console.log(`📋 Registered ${this.sceneFactories.size} scene types`);
  }

  /**
   * Register a custom scene factory
   */
  registerScene(sceneType: string, factory: SceneFactory): void {
    this.sceneFactories.set(sceneType, factory);
    console.log(`📝 Registered scene type: ${sceneType}`);
  }

  // === Command Handling ===

  /**
   * Handle a command from Streamerbot
   * Creates and starts a new scene if the command is recognized
   */
  async handleCommand(command: string, payload?: any): Promise<boolean> {
    console.log(`🎮 SceneManager handling command: ${command}`, payload);

    const factory = this.sceneFactories.get(command);
    if (!factory) {
      console.warn(`❓ Unknown scene command: ${command}`);
      return false;
    }

    try {
      // Create scene
      const scene = factory();
      console.log(`🎬 Creating scene: ${scene.toString()}`);

      // Initialize scene
      await scene.initialize();
      
      // Add to active scenes
      this.activeScenes.push(scene);
      
      // Start scene
      scene.start();
      
      console.log(`✅ Scene started: ${scene.toString()}`);
      console.log(`📊 Active scenes: ${this.activeScenes.length}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to create scene for command ${command}:`, error);
      return false;
    }
  }

  // === Scene Lifecycle ===

  /**
   * Update all active scenes (called every frame)
   */
  update(deltaTime: number): void {
    // Update scenes and remove finished ones
    for (let i = this.activeScenes.length - 1; i >= 0; i--) {
      const scene = this.activeScenes[i];
      if (!scene) continue; // Safety check
      
      try {
        scene.update(deltaTime);
        
        // Remove finished scenes
        if (scene.isFinished()) {
          console.log(`🏁 Scene finished: ${scene.toString()}`);
          scene.destroy();
          this.activeScenes.splice(i, 1);
        }
      } catch (error) {
        console.error(`❌ Error updating scene ${scene.toString()}:`, error);
        // Remove problematic scene
        scene.destroy();
        this.activeScenes.splice(i, 1);
      }
    }
  }

  /**
   * Render all active scenes (called every frame)
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render all active scenes
    for (const scene of this.activeScenes) {
      try {
        scene.render(ctx);
      } catch (error) {
        console.error(`❌ Error rendering scene ${scene.toString()}:`, error);
      }
    }
  }

  // === Scene Management ===

  /**
   * Get number of active scenes
   */
  getActiveSceneCount(): number {
    return this.activeScenes.length;
  }

  /**
   * Get list of active scenes
   */
  getActiveScenes(): readonly Scene[] {
    return this.activeScenes;
  }

  /**
   * Stop all active scenes
   */
  stopAllScenes(): void {
    console.log(`⏸️ Stopping all scenes (${this.activeScenes.length})`);
    
    for (const scene of this.activeScenes) {
      scene.stop();
    }
  }

  /**
   * Destroy all active scenes
   */
  destroyAllScenes(): void {
    console.log(`🗑️ Destroying all scenes (${this.activeScenes.length})`);
    
    for (const scene of this.activeScenes) {
      scene.destroy();
    }
    
    this.activeScenes.length = 0;
  }

  /**
   * Set canvas dimensions (affects new scenes)
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    console.log(`📐 Canvas size updated: ${width}x${height}`);
  }

  // === Available Commands ===

  /**
   * Get list of available scene commands
   */
  getAvailableCommands(): string[] {
    return Array.from(this.sceneFactories.keys());
  }

  /**
   * Check if a command is supported
   */
  isCommandSupported(command: string): boolean {
    return this.sceneFactories.has(command);
  }

  // === Debug Info ===

  /**
   * Get scene manager statistics
   */
  getStats(): {
    activeScenes: number;
    availableCommands: number;
    canvasSize: { width: number; height: number };
  } {
    return {
      activeScenes: this.activeScenes.length,
      availableCommands: this.sceneFactories.size,
      canvasSize: { width: this.canvasWidth, height: this.canvasHeight }
    };
  }

  /**
   * Get detailed debug information
   */
  getDebugInfo(): any {
    return {
      stats: this.getStats(),
      availableCommands: this.getAvailableCommands(),
      activeScenes: this.activeScenes.map(scene => scene.getDebugInfo())
    };
  }

  toString(): string {
    return `SceneManager[${this.activeScenes.length} active, ${this.sceneFactories.size} registered]`;
  }
}