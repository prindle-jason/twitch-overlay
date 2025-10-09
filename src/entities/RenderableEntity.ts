import { TransformEntity } from './TransformEntity';
import { type EntityConfig } from './Entity';

/**
 * RenderableEntity - Base class for entities that can be rendered to canvas
 * 
 * Provides opacity management, dimensions, anchor points, and rendering lifecycle.
 * Handles all rendering-related calculations that need dimensions/anchors.
 * Subclasses implement renderSelf() to define their visual appearance.
 * Note: This is still abstract - concrete subclasses must implement clone()
 */
export abstract class RenderableEntity extends TransformEntity {
  // Visual properties
  public opacity: number = 1;
  public visible: boolean = true;

  // Dimensions (set by subclasses based on content like images)
  public width: number = 0;
  public height: number = 0;

  // Anchor point (0-1, where 0.5 is center)
  public anchorX: number = 0.5;
  public anchorY: number = 0.5;

  constructor(name: string, id?: string, config?: EntityConfig) {
    super(name, id, config);
  }

  // === Dimension and Anchor Management ===

  /**
   * Set dimensions (usually called by subclasses when content is loaded)
   */
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Set anchor point (0-1 range, where 0.5 = center)
   */
  setAnchor(anchorX: number, anchorY: number): void {
    this.anchorX = Math.max(0, Math.min(1, anchorX));
    this.anchorY = Math.max(0, Math.min(1, anchorY));
  }

  // === Rendering Calculations ===

  /**
   * Get the scaled width
   */
  getScaledWidth(): number {
    return this.width * Math.abs(this.scaleX);
  }

  /**
   * Get the scaled height
   */
  getScaledHeight(): number {
    return this.height * Math.abs(this.scaleY);
  }

  /**
   * Get the offset for rendering based on anchor point
   */
  getRenderOffset(): { x: number; y: number } {
    return {
      x: -this.width * this.anchorX,
      y: -this.height * this.anchorY
    };
  }

  /**
   * Get bounding box in world coordinates
   * Useful for collision detection, click testing, etc.
   */
  getBounds(): { left: number; top: number; right: number; bottom: number } {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    const offsetX = -scaledWidth * this.anchorX;
    const offsetY = -scaledHeight * this.anchorY;

    return {
      left: this.x + offsetX,
      top: this.y + offsetY,
      right: this.x + offsetX + scaledWidth,
      bottom: this.y + offsetY + scaledHeight
    };
  }

  // === Rendering ===

  /**
   * Main render method called by systems/scenes
   * Handles transform application and calls renderSelf
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.opacity <= 0) {
      return;
    }

    // Apply transform and opacity
    this.applyTransform(ctx);
    
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = previousAlpha * this.opacity;

    // Let subclass render itself
    this.renderSelf(ctx);

    // Restore context state
    ctx.globalAlpha = previousAlpha;
    this.restoreTransform(ctx);
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

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Show the entity
   */
  show(): void {
    this.visible = true;
  }

  /**
   * Hide the entity
   */
  hide(): void {
    this.visible = false;
  }

  /**
   * Check if entity is effectively visible (visible flag and opacity > 0)
   */
  isEffectivelyVisible(): boolean {
    return this.visible && this.opacity > 0;
  }

  // === Animation Helpers (for simple tweening) ===

  /**
   * Simple opacity fade utility
   * This is basic MVP functionality - more complex animations would use behaviors
   */
  fadeIn(_duration: number, progress: number): void {
    if (progress >= 1) {
      this.opacity = 1;
    } else {
      this.opacity = Math.min(1, progress);
    }
  }

  /**
   * Simple opacity fade out utility
   */
  fadeOut(_duration: number, progress: number): void {
    if (progress >= 1) {
      this.opacity = 0;
    } else {
      this.opacity = Math.max(0, 1 - progress);
    }
  }

  /**
   * Simple fade in then out utility
   * Useful for success scenes that show briefly then disappear
   */
  fadeInOut(_duration: number, progress: number, fadeInRatio: number = 0.2, fadeOutRatio: number = 0.2): void {
    if (progress <= fadeInRatio) {
      // Fade in phase
      this.opacity = progress / fadeInRatio;
    } else if (progress >= (1 - fadeOutRatio)) {
      // Fade out phase
      const fadeOutProgress = (progress - (1 - fadeOutRatio)) / fadeOutRatio;
      this.opacity = 1 - fadeOutProgress;
    } else {
      // Hold phase
      this.opacity = 1;
    }
  }

  // === Cloning Support ===

  /**
   * Helper method for subclasses to copy renderable properties
   * Call this from your clone() implementation after creating the new instance
   */
  protected copyRenderablePropertiesTo(target: RenderableEntity): void {
    // Copy transform properties first
    this.copyTransformPropertiesTo(target);
    
    // Copy visual properties
    target.opacity = this.opacity;
    target.visible = this.visible;
    
    // Copy rendering properties
    target.width = this.width;
    target.height = this.height;
    target.anchorX = this.anchorX;
    target.anchorY = this.anchorY;
  }

  // === Debug Helpers ===

  toString(): string {
    const visibilityInfo = this.visible ? `opacity:${this.opacity.toFixed(2)}` : 'hidden';
    return `${super.toString()} size(${this.width}x${this.height}) [${visibilityInfo}]`;
  }

  getDebugInfo(): any {
    return {
      ...super.getDebugInfo(),
      visual: {
        opacity: this.opacity,
        visible: this.visible,
        effectivelyVisible: this.isEffectivelyVisible()
      },
      rendering: {
        width: this.width,
        height: this.height,
        anchorX: this.anchorX,
        anchorY: this.anchorY,
        scaledWidth: this.getScaledWidth(),
        scaledHeight: this.getScaledHeight()
      }
    };
  }
}