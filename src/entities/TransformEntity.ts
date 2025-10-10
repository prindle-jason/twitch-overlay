import { Entity, type EntityConfig } from './Entity';

/**
 * TransformEntity - Base class for entities that have spatial properties
 * 
 * Handles position, rotation, scale, dimensions, and anchor points.
 * All spatial transformations happen here, including proper anchor-based rotation.
 */
export abstract class TransformEntity extends Entity {
  // Position in world space
  public x: number = 0;
  public y: number = 0;

  // Rotation in degrees (0-360, more intuitive than radians)
  public rotation: number = 0;

  // Independent scaling (allows both uniform and non-uniform)
  public scaleX: number = 1;
  public scaleY: number = 1;

  // Dimensions (set by subclasses based on content like images)
  public width: number = 0;
  public height: number = 0;

  // Anchor point (0-1, where 0.5 is center) - rotation and transforms happen around this point
  public anchorX: number = 0.5;
  public anchorY: number = 0.5;

  constructor(name: string, config?: EntityConfig) {
    super(name, config);
  }

  // === Transform Helper Methods ===

  /**
   * Set position
   */
  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Set rotation in degrees (0-360)
   */
  setRotation(degrees: number): void {
    this.rotation = degrees % 360; // Keep in 0-360 range
  }

  /**
   * Set uniform scale factor (sets both scaleX and scaleY)
   */
  setScale(scale: number): void {
    this.scaleX = scale;
    this.scaleY = scale;
  }

  /**
   * Set non-uniform scale factors independently
   */
  setScaleXY(scaleX: number, scaleY: number): void {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
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

  // === Spatial Calculations ===

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
   * Get the offset for rendering based on anchor point (uses scaled dimensions)
   */
  getRenderOffset(): { x: number; y: number } {
    return {
      x: -this.getScaledWidth() * this.anchorX,
      y: -this.getScaledHeight() * this.anchorY
    };
  }

  /**
   * Get bounding box in world coordinates
   * Useful for collision detection, click testing, etc.
   */
  getBounds(): { left: number; top: number; right: number; bottom: number } {
    const scaledWidth = this.getScaledWidth();
    const scaledHeight = this.getScaledHeight();
    const offset = this.getRenderOffset();

    return {
      left: this.x + offset.x,
      top: this.y + offset.y,
      right: this.x + offset.x + scaledWidth,
      bottom: this.y + offset.y + scaledHeight
    };
  }

  // === Canvas Transform Application ===

  /**
   * Apply this entity's transform to a canvas context
   * Note: Does NOT call save/restore - that's the caller's responsibility
   * This allows proper nesting of transforms in a scene tree
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    // Translate to entity position
    ctx.translate(this.x, this.y);
    
    // If we have rotation, we need to handle anchor-based rotation
    if (this.rotation !== 0) {
      // Translate to the anchor point within the entity (before scaling)
      const anchorOffsetX = this.width * this.anchorX;
      const anchorOffsetY = this.height * this.anchorY;
      ctx.translate(anchorOffsetX, anchorOffsetY);
      
      // Apply rotation around the anchor point
      ctx.rotate((this.rotation * Math.PI) / 180);
      
      // Translate back from anchor point
      ctx.translate(-anchorOffsetX, -anchorOffsetY);
    }
    
    // Apply scale
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }
  }

  // === Cloning Support ===

  /**
   * Create a deep copy of this TransformEntity
   * Subclasses should override this to create the correct concrete type
   */
  abstract clone(): TransformEntity;

  /**
   * Copy this entity's transform properties to the target entity
   * Called by clone() implementations to populate the new instance
   */
  protected cloneTo(target: TransformEntity): void {
    // Copy base entity properties first
    super.cloneTo(target);
    
    // Copy transform properties
    target.x = this.x;
    target.y = this.y;
    target.rotation = this.rotation;
    target.scaleX = this.scaleX;
    target.scaleY = this.scaleY;
    target.width = this.width;
    target.height = this.height;
    target.anchorX = this.anchorX;
    target.anchorY = this.anchorY;
  }

  // === Debug Helpers ===

  toString(): string {
    const scaleInfo = this.scaleX === this.scaleY ? 
      `scale(${this.scaleX.toFixed(2)})` : 
      `scale(${this.scaleX.toFixed(2)}, ${this.scaleY.toFixed(2)})`;
    const anchorInfo = this.anchorX === 0.5 && this.anchorY === 0.5 ? '' : 
      ` anchor(${this.anchorX.toFixed(2)}, ${this.anchorY.toFixed(2)})`;
    return `${super.toString()} pos(${this.x.toFixed(1)}, ${this.y.toFixed(1)}) rot(${this.rotation.toFixed(1)}°) ${scaleInfo} size(${this.width}×${this.height})${anchorInfo}`;
  }

  getDebugInfo(): any {
    return {
      id: this.id,
      name: this.name,
      state: this.state,
      transform: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        scaleX: this.scaleX,
        scaleY: this.scaleY
      },
      dimensions: {
        width: this.width,
        height: this.height,
        anchorX: this.anchorX,
        anchorY: this.anchorY
      }
    };
  }
}