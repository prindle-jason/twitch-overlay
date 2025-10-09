import { Entity, type EntityConfig } from './Entity';

/**
 * TransformEntity - Base class for entities that have spatial properties
 * 
 * Focuses on core spatial transformation: position, rotation, scale
 * Rendering-related calculations are handled by RenderableEntity
 */
export abstract class TransformEntity extends Entity {
  // Position in world space
  public x: number = 0;
  public y: number = 0;

  // Rotation in degrees (0-360, more intuitive than radians)
  public rotation: number = 0;

  // Scale factors (independent X and Y scaling)
  public scaleX: number = 1;
  public scaleY: number = 1;

  constructor(name: string, id?: string, config?: EntityConfig) {
    super(name, id, config);
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

  /**
   * Check if scaling is uniform (scaleX === scaleY)
   */
  isUniformScale(): boolean {
    return this.scaleX === this.scaleY;
  }

  /**
   * Get the uniform scale value (only meaningful if isUniformScale() is true)
   */
  getUniformScale(): number {
    return this.scaleX; // Return scaleX, assuming uniform scaling
  }

  // === Canvas Transform Application ===

  /**
   * Apply this entity's transform to a canvas context
   * Call this before rendering, followed by restoreTransform after rendering
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Translate to position
    ctx.translate(this.x, this.y);
    
    // Apply rotation (convert degrees to radians for canvas)
    if (this.rotation !== 0) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }
    
    // Apply scale
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }
  }

  /**
   * Restore canvas context transform state
   * Always call this after applyTransform and rendering
   */
  restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  // === Cloning Support ===

  /**
   * Helper method for subclasses to copy transform properties
   * Call this from your clone() implementation after creating the new instance
   */
  protected copyTransformPropertiesTo(target: TransformEntity): void {
    // Copy base entity properties first
    this.copyBasicPropertiesTo(target);
    
    // Copy transform properties
    target.x = this.x;
    target.y = this.y;
    target.rotation = this.rotation;
    target.scaleX = this.scaleX;
    target.scaleY = this.scaleY;
  }

  // === Debug Helpers ===

  toString(): string {
    const scaleInfo = this.scaleX === this.scaleY ? 
      `scale(${this.scaleX.toFixed(2)})` : 
      `scale(${this.scaleX.toFixed(2)}, ${this.scaleY.toFixed(2)})`;
    return `${super.toString()} pos(${this.x.toFixed(1)}, ${this.y.toFixed(1)}) rot(${this.rotation.toFixed(1)}°) ${scaleInfo}`;
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
      }
    };
  }
}