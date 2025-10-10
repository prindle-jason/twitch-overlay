import { TransformEntity } from './TransformEntity';
import { type EntityConfig } from './Entity';

/**
 * RenderableEntity - Base class for entities that can be rendered to canvas
 * 
 * Provides opacity management and rendering lifecycle.
 * Dimensions and anchor points are now handled by TransformEntity.
 * Subclasses implement renderSelf() to define their visual appearance.
 * Note: This is still abstract - concrete subclasses must implement clone()
 */
export abstract class RenderableEntity extends TransformEntity {
  // Visual properties
  public opacity: number = 1;

  constructor(name: string, config?: EntityConfig) {
    super(name, config);
  }

  // === Rendering ===

  /**
   * Main render method called by systems/scenes
   * Handles transform application and calls renderSelf
   * Note: Caller is responsible for save/restore of canvas context
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.opacity <= 0) {
      return;
    }

    // Save context state
    ctx.save();

    // Apply transform and opacity
    this.applyTransform(ctx);
    
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = previousAlpha * this.opacity;

    // Let subclass render itself
    this.renderSelf(ctx);

    // Restore context state
    ctx.globalAlpha = previousAlpha;
    ctx.restore();
  }

  /**
   * Abstract method for subclasses to implement their rendering logic
   * Called with transform and opacity already applied
   */
  protected abstract renderSelf(ctx: CanvasRenderingContext2D): void;

  // === Visual Property Helpers ===

  /**
   * Set opacity (0-1)
   */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  // === Cloning Support ===

  /**
   * Create a deep copy of this RenderableEntity
   * Subclasses should override this to create the correct concrete type
   */
  abstract clone(): RenderableEntity;

  /**
   * Copy this entity's renderable properties to the target entity
   * Called by clone() implementations to populate the new instance
   */
  protected cloneTo(target: RenderableEntity): void {
    // Copy transform properties first (includes dimensions and anchor)
    super.cloneTo(target);
    
    // Copy visual properties
    target.opacity = this.opacity;
  }

  // === Debug Helpers ===

  toString(): string {
    const visibilityInfo = `opacity:${this.opacity.toFixed(2)}`;
    return `${super.toString()} [${visibilityInfo}]`;
  }

  getDebugInfo(): any {
    return {
      ...super.getDebugInfo(),
      visual: {
        opacity: this.opacity,
      }
    };
  }
}