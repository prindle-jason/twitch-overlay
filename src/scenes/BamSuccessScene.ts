import { Scene } from './Scene';
import { ImageEntity } from '../entities/ImageEntity';
import { EntityState } from '../entities/EntityState';

/**
 * BamSuccessScene - Simple success scene with centered image and fade animation
 * 
 * Shows a success image that fades in, holds, then fades out.
 * This is a simple MVP scene to test the infrastructure.
 */
export class BamSuccessScene extends Scene {
  private duration: number = 3000; // 3 seconds total
  private fadeInRatio: number = 0.2; // 20% fade in
  private fadeOutRatio: number = 0.2; // 20% fade out
  
  private startTime: number = 0;
  private successImage: ImageEntity | null = null;

  constructor() {
    super('BamSuccess');
  }

  // === Scene Creation ===

  protected async createEntities(): Promise<void> {
    console.log(`🎬 Creating BamSuccess scene entities`);

    // Create the success image entity
    this.successImage = new ImageEntity('bobSuccess.png', 'successImage');
    
    // Center the image on screen (assumes 1280x720 canvas)
    // TODO: Get actual canvas dimensions from somewhere
    this.successImage.setPosition(1280 / 2, 720 / 2);
    this.successImage.setAnchor(0.5, 0.5); // Center anchor
    
    // Start invisible - will fade in
    this.successImage.setOpacity(0);
    
    this.addEntity(this.successImage);
    
    console.log(`✅ BamSuccess scene created with 1 entity`);
  }

  // === Scene Lifecycle ===

  start(): void {
    super.start();
    this.startTime = Date.now();
    console.log(`▶️ BamSuccess scene started - will run for ${this.duration}ms`);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (!this.isPlaying || !this.successImage) return;

    // Calculate progress (0-1)
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);

    // Apply fade in/out animation
    this.successImage.fadeInOut(this.duration, progress, this.fadeInRatio, this.fadeOutRatio);

    // Finish scene when duration is complete
    if (progress >= 1) {
      console.log(`🏁 BamSuccess scene completed`);
      this.successImage.state = EntityState.FINISHED;
    }
  }

  // === Configuration ===

  /**
   * Set the canvas dimensions for proper centering
   */
  setCanvasSize(width: number, height: number): void {
    if (this.successImage) {
      this.successImage.setPosition(width / 2, height / 2);
    }
  }

  /**
   * Change the success image
   */
  async setSuccessImage(imageFilename: string): Promise<void> {
    if (this.successImage) {
      await this.successImage.setImage(imageFilename);
    }
  }

  /**
   * Set the scene duration
   */
  setDuration(duration: number): void {
    // Only allow changes before scene starts
    if (!this.isPlaying) {
      this.duration = duration;
    }
  }

  /**
   * Set fade timing ratios
   */
  setFadeTiming(fadeInRatio: number, fadeOutRatio: number): void {
    // Only allow changes before scene starts
    if (!this.isPlaying) {
      this.fadeInRatio = Math.max(0, Math.min(0.5, fadeInRatio));
      this.fadeOutRatio = Math.max(0, Math.min(0.5, fadeOutRatio));
    }
  }

  // === Static Factory Methods ===

  /**
   * Create a BamSuccess scene with Bob success image
   */
  static createBobSuccess(): BamSuccessScene {
    const scene = new BamSuccessScene();
    // Default image is already bobSuccess.png
    return scene;
  }

  /**
   * Create a BamSuccess scene with Bub success image
   */
  static createBubSuccess(): BamSuccessScene {
    const scene = new BamSuccessScene();
    // Will need to change image after creation
    scene.createEntities().then(() => {
      scene.setSuccessImage('bubSuccess.png');
    });
    return scene;
  }

  /**
   * Create a custom success scene with specified image
   */
  static createCustomSuccess(imageFilename: string, duration: number = 3000): BamSuccessScene {
    const scene = new BamSuccessScene();
    scene.setDuration(duration);
    scene.createEntities().then(() => {
      scene.setSuccessImage(imageFilename);
    });
    return scene;
  }

  // === Debug Info ===

  toString(): string {
    const elapsed = this.startTime > 0 ? Date.now() - this.startTime : 0;
    const progress = this.duration > 0 ? (elapsed / this.duration * 100).toFixed(1) : '0';
    return `${super.toString()} [${progress}% complete]`;
  }

  getDebugInfo(): any {
    const baseInfo = super.getDebugInfo();
    const elapsed = this.startTime > 0 ? Date.now() - this.startTime : 0;
    const progress = this.duration > 0 ? elapsed / this.duration : 0;

    return {
      ...baseInfo,
      animation: {
        duration: this.duration,
        elapsed: elapsed,
        progress: progress,
        fadeInRatio: this.fadeInRatio,
        fadeOutRatio: this.fadeOutRatio,
        startTime: this.startTime
      },
      image: this.successImage ? {
        filename: this.successImage.getImageFilename(),
        loaded: this.successImage.isLoaded(),
        opacity: this.successImage.opacity,
        position: { x: this.successImage.x, y: this.successImage.y }
      } : null
    };
  }
}