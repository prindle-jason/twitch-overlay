import { Entity } from '@/entities/Entity';
import { TransformEntity } from '@/entities/TransformEntity';
import { RenderableEntity } from '@/entities/RenderableEntity';

/**
 * RenderSystem - Handles visual rendering of entities to canvas
 * 
 * Minimal MVP implementation focusing on tree traversal and canvas transforms.
 * Uses Canvas 2D transform capabilities for efficient rendering without complex world coordinate calculations.
 */
export class RenderSystem {
  /**
   * Process all entities for rendering
   * @param entities - Array of root entities to render
   * @param ctx - Canvas rendering context
   */
  process(entities: Entity[], ctx: CanvasRenderingContext2D): void {
    entities.forEach(entity => {
      this.renderEntityTree(entity, ctx);
    });
  }

  /**
   * Recursively render an entity and its children with proper transform hierarchy
   */
  private renderEntityTree(entity: Entity, ctx: CanvasRenderingContext2D): void {
    // Apply transform if entity has spatial properties
    const hasTransform = entity instanceof TransformEntity;
    if (hasTransform) {
      ctx.save();
      this.applyLocalTransform(entity, ctx);
    }

    // Render entity if it's renderable and should be rendered
    if (entity instanceof RenderableEntity && this.shouldRender(entity)) {
      entity.renderSelf(ctx);
    }

    // Render children (inherit transform context)
    entity.children.forEach(child => {
      this.renderEntityTree(child, ctx);
    });

    // Restore transform context
    if (hasTransform) {
      ctx.restore();
    }
  }

  /**
   * Apply local transform of entity to canvas context
   */
  private applyLocalTransform(entity: TransformEntity, ctx: CanvasRenderingContext2D): void {
    // Order matters: Translate → Rotate → Scale
    
    // 1. Translate to entity position
    ctx.translate(entity.x, entity.y);
    
    // 2. Rotate around entity center
    if (entity.rotation !== 0) {
      ctx.rotate((entity.rotation * Math.PI) / 180);
    }
    
    // 3. Scale rendering
    if (entity.scaleX !== 1 || entity.scaleY !== 1) {
      ctx.scale(entity.scaleX, entity.scaleY);
    }
  }

  /**
   * Determine if entity should be rendered
   */
  private shouldRender(entity: RenderableEntity): boolean {
    // Skip if completely transparent
    if (entity.opacity <= 0.001) {
      return false;
    }
    
    return true;
  }
}